"use client";

import { ReactNode } from "react";
import { LensProvider } from "@lens-protocol/react";
import { lensClient } from "@/lib/lens/client";
import { WagmiProvider } from "wagmi";
import { config as wagmiConfig } from "@/lib/wagmi/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { LensSessionProvider } from "@/src/providers/LensSessionProvider";
import { SupabaseProvider } from "@/src/providers/SupabaseProvider";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider mode="light">
          <LensProvider client={lensClient}>
            <LensSessionProvider>
              <SupabaseProvider>{children}</SupabaseProvider>
            </LensSessionProvider>
          </LensProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
