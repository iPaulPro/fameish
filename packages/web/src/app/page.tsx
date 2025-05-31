"use client";

import AnimatedCountdownClock from "@/components/AnimatedCountdownClock";
import Link from "next/link";
import { LuChevronRight, LuLoader } from "react-icons/lu";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CountUp from "@/components/CountUp";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import { useReadContract } from "wagmi";
import { fameishAbi } from "@/lib/abis/fameish";
import { useEffect, useState } from "react";
import { Account } from "@lens-protocol/react";
import { fetchAccount } from "@lens-protocol/client/actions";
import { lensClient } from "@/lib/lens/client";
import { FaUserCircle } from "react-icons/fa";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function Home() {
  const [winnerAccount, setWinnerAccount] = useState<Account | undefined>(undefined);
  const [userCount, setUserCount] = useState<number>(0);

  const { data: winnerAddress, isLoading: isWinnerLoading } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAMEISH_CONTRACT_ADDRESS! as `0x${string}`,
    abi: fameishAbi,
    functionName: "winner",
  });

  const { data: drawingTimestamp, isLoading: isTimestampLoading } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAMEISH_CONTRACT_ADDRESS! as `0x${string}`,
    abi: fameishAbi,
    functionName: "winnerSetTimestamp",
  });

  const { data: followerCount } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAMEISH_CONTRACT_ADDRESS! as `0x${string}`,
    abi: fameishAbi,
    functionName: "followerCount",
  });

  const supabase = createSupabaseClient();

  useEffect(() => {
    const updateUserCount = async () => {
      const { data, error } = await supabase.from("record_count").select().eq("table_name", "user").limit(1).single();
      if (error) {
        console.error("Error fetching user count:", error);
        return;
      }
      if (data) {
        setUserCount(data.count);
      }
    };

    updateUserCount();
  }, []);

  useEffect(() => {
    if (!winnerAddress) return;

    const getAccount = async () => {
      const res = await fetchAccount(lensClient, {
        address: winnerAddress,
      });
      if (res.isOk() && res.value) {
        setWinnerAccount(res.value);
      }
    };

    getAccount();
  }, [winnerAddress]);

  return (
    <div className="min-h-screen relative flex flex-col">
      <Header showLinks={true} />

      <main className="container flex-grow mx-auto px-4 pt-8 md:pt-24 relative flex flex-col">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto pb-8 md:pb-12">
          <h1 className="text-3xl md:text-[4rem] lg:text-[4.5rem] xl:text-[5rem] font-medium leading-10 md:leading-20 tracking-tighter mb-8 text-balance">
            Become the most-followed person on Lens, for a day
          </h1>

          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-fit text-lg !ps-12 !pe-10 !py-8 rounded-full font-bold hover:no-underline",
            )}
          >
            Sign up
            <LuChevronRight strokeWidth={4} className="signup-icon ml-2 h-5 w-5 scale-x-200 text-accent" />
          </Link>

          <div className="text-sm opacity-65 text-center pt-4">It&apos;s totally free to join and use.</div>
        </div>
        <div className="flex-grow flex flex-col justify-end items-center">
          <div className="bg-background w-full max-w-3xl rounded-t-3xl shadow-xl px-6 py-8 md:py-12">
            {isWinnerLoading || isTimestampLoading ? (
              <div className="flex flex-grow items-center justify-center h-96">
                <LuLoader className="animate-spin flex-none opacity-45 w-4 h-4" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 min-h-96">
                {drawingTimestamp && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-lg opacity-45 font-medium">Next winner selected in</div>
                    <AnimatedCountdownClock targetDate={new Date(Number(drawingTimestamp) * 1000 + 86400000)} />
                  </div>
                )}

                {winnerAccount && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-lg opacity-45 font-medium pt-2">Today&apos;s winner</div>

                    <div className="flex flex-col items-center gap-1">
                      <Avatar className="w-36 h-36">
                        <AvatarImage src={winnerAccount.metadata?.picture} />
                        <AvatarFallback>
                          <FaUserCircle className="w-36 h-36 opacity-45" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex gap-2">
                        <span className="font-bold">
                          {winnerAccount.metadata?.name ?? winnerAccount.username?.localName ?? winnerAccount.address}
                        </span>
                        {winnerAccount.metadata?.name && winnerAccount.username && (
                          <span className="opacity-65">@{winnerAccount.username.localName}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center bg-accent rounded-full h-12">
                      <span className="bg-neutral-100 rounded-full h-full px-6 flex items-center font-medium">
                        Followers gained
                      </span>
                      <CountUp
                        to={(userCount > 0 && userCount - 1) || (followerCount && Number(followerCount)) || 0}
                        duration={3}
                        className="font-bold pl-4 pr-6"
                        separator=","
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div
          className="hidden md:block floating absolute md:top-[24rem] md:left-0 lg:top-96 lg:left-12
             xl:top-96 xl:left-40 2xl:left-80"
        >
          <div className="w-32 h-32 rounded-full overflow-hidden border-8 border-white bg-neutral-300 shadow-lg -rotate-6">
            <img src="/images/dummy_profile_photo.jpeg" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
        <div
          className="hidden md:block floating delay absolute md:top-[30rem] md:right-0 lg:top-[30rem] lg:right-16
             xl:top-[30rem] xl:right-48 2xl:right-80"
        >
          <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-white bg-neutral-300 shadow-lg rotate-2">
            <img src="/images/dummy_profile_photo-2.webp" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </main>
      <div className="hidden md:block absolute bottom-4 right-4 gap-2 opacity-65">
        <div className="flex items-center">
          <span className="font-medium">Built on</span>
          <img src="/images/lens-logo.svg" className="h-5 inline ml-2" alt="Lens logo" />
        </div>
      </div>
    </div>
  );
}
