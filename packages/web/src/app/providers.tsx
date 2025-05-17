"use client";

import { ReactNode } from "react";
import { LensProvider } from "@lens-protocol/react";
import { lensClient } from "@/lib/lens/client";

export default function Providers({ children }: { children: ReactNode }) {
  return <LensProvider client={lensClient}>{children}</LensProvider>;
}
