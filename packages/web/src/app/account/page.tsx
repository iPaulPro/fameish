"use client";

import Header from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaCheckCircle, FaUserCircle } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { useLensSession } from "@/hooks/useLensSession";
import { truncateAddress } from "@/lib/utils";
import { Separator } from "@/src/components/ui/separator";
import Link from "next/link";
import { LuLoader } from "react-icons/lu";
import { useSupabase } from "@/hooks/useSupabase";
import { fetchUserByAccountAddress } from "@/operations/user";
import { User } from "@/lib/supabase/tables";
import { toast } from "sonner";

export default function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { client: supabase } = useSupabase();
  const { account } = useLensSession();

  const updateUser = useCallback(
    async (accountAddress: string) => {
      const { data, error } = await fetchUserByAccountAddress(supabase, accountAddress);
      if (error) {
        setError("Unable to get user details");
        return;
      }
      setUser(data);
    },
    [supabase],
  );

  useEffect(() => {
    if (!account) return;
    updateUser(account.address);
  }, [account, updateUser]);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error]);

  return (
    <div className="w-full flex-grow flex flex-col">
      <Header />
      <div className="flex-grow w-full h-full flex justify-center items-center -mt-10">
        <div className="bg-background rounded-2xl shadow-xl w-full max-w-4xl grid md:grid-cols-12 items-center overflow-hidden">
          <div
            className="w-full h-full p-6 md:col-span-5 flex items-center justify-center px-6 rounded-l-xl border-b
            md:border-r border-neutral-100"
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
          <div className="md:min-h-96 md:col-span-7 p-6 md:p-12 flex flex-col gap-2 from-neutral-50 bg-gradient-to-l ">
            <div className="flex flex-col">
              <div className="text-2xl font-semibold text-secondary-foreground">Your account</div>
              <div className="text-sm opacity-65">Manage your account settings and preferences.</div>
            </div>
            <Separator />
            {user ? (
              user.eligible ? (
                <div className="flex-grow flex flex-wrap gap-2 items-center py-8">
                  <FaCheckCircle className="w-8 h-8 text-emerald-400" />
                  <span className="text-base md:text-lg font-semibold">You are eligible to win the next drawing!</span>
                </div>
              ) : (
                <div className="flex-grow flex flex-wrap gap-2 items-center py-8">
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
            <Link href="#" className="font-normal opacity-65">
              Deactivate my account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
