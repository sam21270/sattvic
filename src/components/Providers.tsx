"use client";

import { SessionProvider } from "next-auth/react";
import { CloudSync } from "@/components/ui/CloudSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CloudSync />
      {children}
    </SessionProvider>
  );
}
