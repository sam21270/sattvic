import { lookup } from "node:dns/promises";

/**
 * Server-side fetch of a user-supplied URL.
 *
 * The recipe importer takes a link from anyone (the AI routes are
 * unauthenticated) and fetched it directly, which is server-side request
 * forgery: a caller could point it at the cloud metadata endpoint, at
 * localhost, or at anything else on the private network, and read the response
 * back through the extraction output.
 *
 * So: only http(s), only hostnames that resolve to a public address, redirects
 * followed manually with the same check applied to every hop (otherwise a
 * public URL can 302 straight to 169.254.169.254), and a byte cap so a huge
 * response cannot exhaust memory.
 */

const MAX_BYTES = 2_000_000;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;

/** Loopback, private, link-local, carrier-grade NAT and other non-public space. */
export function isPrivateAddress(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return (
      a === 0 ||                       // this network
      a === 10 ||                      // private
      a === 127 ||                     // loopback
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) ||      // link-local — cloud metadata lives here
      (a === 172 && b >= 16 && b <= 31) ||  // private
      (a === 192 && b === 168) ||      // private
      a >= 224                         // multicast + reserved
    );
  }
  const s = ip.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    s === "::" || s === "::1" ||       // unspecified, loopback
    s.startsWith("fc") || s.startsWith("fd") || // unique local
    s.startsWith("fe80") ||            // link-local
    s.startsWith("::ffff:")            // IPv4-mapped — check the v4 part separately
  );
}

async function assertPublic(raw: string): Promise<URL> {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("That does not look like a valid link."); }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https links can be imported.");
  }
  // An IP-mapped hostname skips DNS, so check the literal too.
  if (isPrivateAddress(url.hostname)) throw new Error("That link points to a private address.");

  let address: string;
  try {
    ({ address } = await lookup(url.hostname));
  } catch {
    // Don't surface raw resolver errors like "getaddrinfo ENOTFOUND host".
    throw new Error("That site could not be reached.");
  }
  if (isPrivateAddress(address)) throw new Error("That link points to a private address.");
  return url;
}

/** Fetches a user-supplied page and returns its body, capped. */
export async function fetchPublicPage(raw: string): Promise<string> {
  let target = raw;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublic(target);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SattvicRecipeImport/1.0)" },
      redirect: "manual", // every hop gets re-checked instead of trusting fetch
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      if (!next) throw new Error("That link could not be followed.");
      target = new URL(next, url).toString();
      continue;
    }
    if (!res.ok) throw new Error("That page could not be loaded.");

    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) throw new Error("That page is too large to import.");

    // Read with a cap rather than trusting content-length, which can lie.
    const reader = res.body?.getReader();
    if (!reader) return "";
    const decoder = new TextDecoder();
    let out = "";
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BYTES) { await reader.cancel(); break; }
      out += decoder.decode(value, { stream: true });
    }
    return out + decoder.decode();
  }
  throw new Error("That link redirects too many times.");
}
