// The recipe importer fetches a user-supplied URL server-side on an endpoint
// anyone can call. Without this filter it was server-side request forgery: a
// caller could read cloud metadata or anything on the private network back
// through the extraction output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isPrivateAddress } from "../src/lib/safeFetch.ts";

test("blocks the cloud metadata endpoint", () => {
  // The single most-abused SSRF target — instance credentials live here.
  assert.equal(isPrivateAddress("169.254.169.254"), true);
});

test("blocks loopback and localhost addresses", () => {
  for (const ip of ["127.0.0.1", "127.1.1.1", "0.0.0.0", "::1", "::"]) {
    assert.equal(isPrivateAddress(ip), true, `must block ${ip}`);
  }
});

test("blocks RFC1918 private ranges", () => {
  for (const ip of ["10.0.0.1", "10.255.255.255", "192.168.1.1",
                    "172.16.0.1", "172.31.255.255"]) {
    assert.equal(isPrivateAddress(ip), true, `must block ${ip}`);
  }
});

test("blocks carrier-grade NAT, link-local, multicast and IPv6 internals", () => {
  for (const ip of ["100.64.0.1", "169.254.1.1", "224.0.0.1", "255.255.255.255",
                    "fd00::1", "fc00::1", "fe80::1"]) {
    assert.equal(isPrivateAddress(ip), true, `must block ${ip}`);
  }
});

test("does not block ordinary public addresses", () => {
  // 172.32 and 100.128 sit just outside the private ranges — off-by-one guards.
  for (const ip of ["8.8.8.8", "1.1.1.1", "142.250.190.78",
                    "172.32.0.1", "172.15.0.1", "100.128.0.1", "2606:4700::1111"]) {
    assert.equal(isPrivateAddress(ip), false, `must allow ${ip}`);
  }
});
