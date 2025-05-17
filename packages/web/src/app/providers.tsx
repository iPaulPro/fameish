"use client";

import { ReactNode } from "react";
import { LensProvider } from "@lens-protocol/react";
import { lensClient } from "@/lib/lens/client";
import { WagmiProvider } from "wagmi";
import { config as wagmiConfig } from "@/lib/wagmi/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LensProvider client={lensClient}>{children}</LensProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
