import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLensSession } from "@/hooks/useLensSession";
import { useRouter } from "next/navigation";
import AnimatedCountdownClock from "@/components/AnimatedCountdownClock";
import { useReadContract } from "wagmi";
import { fameishAbi } from "@/lib/abis/fameish";
import Image from "next/image";
import { track } from "@vercel/analytics";
import ConfirmDialog, { ConfirmDialogRef } from "@/components/ConfirmDialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { User } from "@/lib/supabase/tables";
import { useSupabase } from "@/hooks/useSupabase";
import { fetchUserByAccountAddress } from "@/operations/user";

type HeaderProps = {
  showLinks?: boolean;
  showAccount?: boolean;
};

export default function Header({ showLinks, showAccount = true }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);

  const { client: supabase } = useSupabase();
  const { account, walletAddress, logOut } = useLensSession();

  const router = useRouter();

  const { data: drawingTimestamp } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAMEISH_CONTRACT_ADDRESS! as `0x${string}`,
    abi: fameishAbi,
    functionName: "winnerSetTimestamp",
  });

  const confirmLogoutDialog = useRef<ConfirmDialogRef>(null);

  const updateUser = useCallback(
    async (accountAddress: string) => {
      const { data } = await fetchUserByAccountAddress(supabase, accountAddress);
      setUser(data);
    },
    [supabase],
  );

  const handleLogout = async () => {
    await logOut();
    router.push("/");
  };

  useEffect(() => {
    if (!account) return;
    updateUser(account.address);
  }, [account, updateUser]);

  return (
    <>
      <header className="w-full px-6 py-4 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center">
        <Link href="/" className={`${!showLinks && "md:opacity-45"}`}>
          <Image src="/images/fameish-logo.svg" alt="Fameish logo" width={1454} height={367} className="h-7 w-auto" />
        </Link>

        {showLinks ? (
          <nav className="hidden md:flex items-center space-x-8">
            <Button
              variant="link"
              className="text-gray-700 hover:text-black p-0"
              onClick={() => {
                track("Click", { name: "How it works", location: "Header" });
                router.push("/signup");
              }}
            >
              How it works
            </Button>
            <Button
              variant="link"
              className="text-gray-700 hover:text-black p-0"
              onClick={() => {
                track("Click", { name: "Terms of service", location: "Header" });
                router.push("/p/terms");
              }}
            >
              Terms of service
            </Button>
          </nav>
        ) : (
          <div className="hidden md:block">
            {drawingTimestamp !== undefined && drawingTimestamp > 0 && (
              <AnimatedCountdownClock
                textClassName="!text-xl opacity-65"
                animationEnabled={false}
                targetDate={new Date(Number(drawingTimestamp) * 1000 + 86400000)}
                onComplete={() => alert("done!")}
              />
            )}
          </div>
        )}

        {showAccount && (
          <div className="flex items-center justify-end gap-x-6">
            {user ? (
              showLinks ? (
                <Link href="/account" className="font-medium">
                  Account
                </Link>
              ) : (
                <Button variant="link" onClick={() => confirmLogoutDialog.current?.open()} className="opacity-65 p-0">
                  Log out
                </Button>
              )
            ) : (
              showLinks && (
                <Link href="/signup" className="font-medium">
                  Log in
                </Link>
              )
            )}
            {showLinks && !walletAddress && (
              <Button onClick={() => router.push("/signup")} size="lg" className="hidden md:block font-medium">
                Sign up
              </Button>
            )}
          </div>
        )}
      </header>
      <ConfirmDialog ref={confirmLogoutDialog} title="Log out" confirmButtonText="Log out" onConfirm={handleLogout}>
        <div className="flex flex-col gap-2">
          <span>Are you sure you want to log out?</span>
          <span className="text-xs opacity-65">
            This will <strong>not</strong> affect your eligibility for future drawings.
          </span>
        </div>
      </ConfirmDialog>
    </>
  );
}
