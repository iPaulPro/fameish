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
      <div className="hidden md:block absolute bottom-4 left-4">
        <div className="flex items-center gap-4">
          <a href="https://hey.xyz/u/fameish" target="_blank" rel="noreferrer" className="opacity-65 hover:opacity-100">
            <span className="sr-only">Hey</span>
            <svg viewBox="0 0 108 68" className="w-7">
              <path
                d="M73.914 17.903c4.401-3.672 9.311-5.07 14.02-4.716 5.023.377 9.671 2.731 13.143 6.151 3.471 3.42 5.856 7.995 6.238 12.932.385 4.982-1.283 10.2-5.681 14.779-.402.422-.813.838-1.233 1.249C80.453 67.948 53.955 68 53.684 68c-.136 0-26.718-.001-46.718-19.704l-.004-.005c-.413-.409-.82-.821-1.22-1.235l-.003-.004c-4.4-4.575-6.07-9.792-5.686-14.774.38-4.936 2.764-9.511 6.235-12.933 3.47-3.42 8.118-5.777 13.141-6.155 4.71-.355 9.62 1.04 14.023 4.71.474-5.66 2.94-10.066 6.521-13.094C43.793 1.576 48.77 0 53.683 0c4.915 0 9.891 1.575 13.71 4.806 3.581 3.029 6.048 7.435 6.521 13.097Zm-5.244 20.82c-.546 0-.735.776-.387 1.187a4.15 4.15 0 0 1 .987 2.689c0 2.32-1.909 4.201-4.264 4.201-2.356 0-4.265-1.881-4.265-4.201 0-.124-.164-.186-.239-.086-.672.91-1.126 1.932-1.313 3.005-.105.604-.603 1.105-1.23 1.105h-.346c-.817 0-1.491-.653-1.37-1.444.826-5.421 6.25-9.353 12.427-9.353s11.6 3.932 12.427 9.353c.12.79-.554 1.444-1.371 1.444-.818 0-1.465-.657-1.643-1.437-.808-3.554-4.556-6.464-9.413-6.464ZM30.8 42.598c0-.164-.216-.252-.317-.122-.719.925-1.209 1.971-1.416 3.075-.123.651-.66 1.193-1.338 1.193h-.254c-.817 0-1.492-.653-1.371-1.444.827-5.424 6.25-9.353 12.427-9.353s11.6 3.93 12.427 9.353c.121.791-.553 1.444-1.37 1.444-.818 0-1.465-.656-1.643-1.437-.808-3.555-4.556-6.463-9.414-6.463-.441 0-.603.61-.307.931a4.152 4.152 0 0 1 1.105 2.823c0 2.32-1.91 4.201-4.265 4.201-2.355 0-4.264-1.881-4.264-4.201ZM58.427 52.73c.578-.566 1.47-.841 2.188-.458.717.384.99 1.274.473 1.894-1.684 2.017-4.41 3.296-7.416 3.296-3.005 0-5.737-1.265-7.423-3.298-.515-.621-.24-1.511.48-1.892.718-.381 1.61-.102 2.186.464 1.112 1.092 2.798 1.83 4.757 1.83 1.954 0 3.642-.746 4.755-1.836Z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
          </a>
          <a
            href="https://github.com/iPaulPro/fameish"
            target="_blank"
            rel="noreferrer"
            className="opacity-65 hover:opacity-100"
          >
            <span className="sr-only">github</span>
            <svg viewBox="0 0 24 24" className="w-5" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
        </div>
      </div>
      <div className="hidden md:block absolute bottom-4 right-4 gap-2 opacity-65">
        <div className="flex items-center">
          <span className="font-medium">Built on</span>
          <img src="/images/lens-logo.svg" className="h-5 inline ml-2" alt="Lens logo" />
        </div>
      </div>
    </div>
  );
}
