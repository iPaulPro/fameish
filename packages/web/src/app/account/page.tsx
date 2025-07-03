"use client";

import Header from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaCheckCircle, FaUserCircle, FaExclamationTriangle } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { useLensSession } from "@/hooks/useLensSession";
import { truncateAddress } from "@/lib/utils";
import { Separator } from "@/src/components/ui/separator";
import Link from "next/link";
import { LuLoader } from "react-icons/lu";
import { useSupabase } from "@/hooks/useSupabase";
import { fetchUserByAccountAddress } from "@/operations/user";
import { User } from "@/lib/supabase/tables";
import { useRouter } from "next/navigation";

export default function Account() {
  const [user, setUser] = useState<User | null>(null);

  const { client: supabase } = useSupabase();
  const { account, accountLoading, lensUserLoading } = useLensSession();
  const router = useRouter();

  const updateUser = useCallback(
    async (accountAddress: string) => {
      const { data, error } = await fetchUserByAccountAddress(supabase, accountAddress);
      if (!data || error) {
        router.replace("/");
        return;
      }
      setUser(data);
    },
    [supabase, router],
  );

  useEffect(() => {
    if (accountLoading || lensUserLoading || account === undefined) return;
    if (account == null) {
      router.replace("/");
      return;
    }
    updateUser(account.address);
  }, [account, updateUser, router, accountLoading, lensUserLoading]);

  if (!user) {
    return (
      <div className="w-full flex-grow flex flex-col flex justify-center items-center">
        <LuLoader className="animate-spin flex-none opacity-45 w-4 h-4" />
      </div>
    );
  }

  return (
    <div className="w-full flex-grow flex flex-col">
      <Header />
      <div className="flex-grow w-full h-full flex justify-center items-center md:-mt-10">
        <div className="rounded-2xl shadow-xl w-full max-w-4xl grid md:grid-cols-12 items-center overflow-hidden  md:border-t md:border-t-neutral-100">
          <div
            className="w-full h-full p-6 md:col-span-5 flex items-center justify-center px-6 border-b md:border-b-0
            from-background bg-gradient-to-t md:bg-gradient-to-l md:border-r border-neutral-100"
          >
            {account ? (
              <div className="flex flex-col items-center gap-2">
                <Avatar className="w-36 h-36">
                  <AvatarImage src={account.metadata?.picture} />
                  <AvatarFallback>
                    <FaUserCircle className="w-36 h-36 opacity-45" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-2xl font-semibold text-secondary-foreground">
                  @{account.username?.localName ?? truncateAddress(account.address)}
                </div>
              </div>
            ) : (
              <div className="flex flex-grow items-center justify-center">
                <LuLoader className="animate-spin flex-none opacity-45 w-4 h-4" />
              </div>
            )}
          </div>
          <div className="bg-background md:min-h-96 md:col-span-7 p-6 md:p-12 flex flex-col gap-2">
            <div className="flex flex-col">
              <div className="text-xl md:text-2xl font-semibold text-secondary-foreground">Your account</div>
              <div className="text-sm opacity-65">Manage your account settings and preferences.</div>
            </div>
            <Separator />
            {user ? (
              user.eligible ? (
                <div className="flex-grow flex flex-wrap gap-2 items-center justify-center md:justify-start py-8">
                  <FaCheckCircle className="w-8 h-8 text-emerald-400" />
                  <span className="text-base md:text-lg font-semibold">You are eligible to win the next drawing!</span>
                </div>
              ) : (
                <div className="flex-grow flex flex-wrap gap-2 items-center justify-center md:justify-start py-8">
                  <FaExclamationTriangle className="w-8 h-8 text-red-400" />
                  <span className="text-base md:text-lg font-semibold">
                    You are not eligible to win the next drawing.
                  </span>
                </div>
              )
            ) : (
              <div className="flex flex-grow items-center justify-center">
                <LuLoader className="animate-spin flex-none opacity-45 w-4 h-4" />
              </div>
            )}
            <Separator />
            <Link href="#" className="font-normal opacity-65 text-sm md:text-base">
              Deactivate my account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
