"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

// Mirrors the whole `sattvic*` localStorage namespace to the user's account so
// meals, streak, badges, plan, fasts, allergies — everything — follow them
// across devices. Last-write-wins by timestamp; guarded against a fresh device
// wiping good server data.

const TS_KEY = "sattvic-sync-ts";       // local copy of the blob's timestamp
const RELOAD_FLAG = "sattvic-synced";   // session flag so we reload at most once

function collect(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith("sattvic") && k !== TS_KEY) out[k] = localStorage.getItem(k) ?? "";
  }
  return out;
}

function apply(data: Record<string, string>) {
  // replace the local sattvic namespace with the server's (minus the ts key)
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i)!;
    if (k.startsWith("sattvic") && k !== TS_KEY) localStorage.removeItem(k);
  }
  for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
}

export function CloudSync() {
  const { status } = useSession();
  const canPush = useRef(false);
  const lastBlob = useRef("");

  async function push() {
    const data = collect();
    if (Object.keys(data).length === 0) return; // never push empty over good data
    const ts = Date.now();
    localStorage.setItem(TS_KEY, String(ts));
    lastBlob.current = JSON.stringify(data);
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, updatedAt: ts }),
      });
    } catch {}
  }

  // initial pull, then decide push/apply
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sync");
        if (!res.ok || cancelled) return;
        const { data, updatedAt } = await res.json();
        const localTs = Number(localStorage.getItem(TS_KEY) ?? 0);
        const serverTs = Number(updatedAt ?? 0);
        const hasServer = data && Object.keys(data).length > 0;
        const hasLocal = Object.keys(collect()).length > 0;

        if (hasServer && serverTs > localTs) {
          // server is newer → adopt it and reload so every page re-reads storage
          apply(data);
          localStorage.setItem(TS_KEY, String(serverTs));
          if (!sessionStorage.getItem(RELOAD_FLAG)) {
            sessionStorage.setItem(RELOAD_FLAG, "1");
            window.location.reload();
            return;
          }
        } else if (hasLocal && (localTs > serverTs || !hasServer)) {
          // local is newer, or first-ever sync → push it up
          await push();
        }
        lastBlob.current = JSON.stringify(collect());
        canPush.current = true;
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [status]);

  // push local changes: poll every 5s for a changed blob, and on tab hide
  useEffect(() => {
    if (status !== "authenticated") return;
    const id = setInterval(() => {
      if (!canPush.current) return;
      const blob = JSON.stringify(collect());
      if (blob !== lastBlob.current && blob !== "{}") push();
    }, 5000);
    const onHide = () => { if (canPush.current && document.hidden) push(); };
    document.addEventListener("visibilitychange", onHide);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onHide); };
  }, [status]);

  return null;
}
