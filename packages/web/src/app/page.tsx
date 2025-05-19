"use client";

import AnimatedCountdownClock from "@/components/AnimatedCountdownClock";
import Link from "next/link";
import { LuChevronRight } from "react-icons/lu";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CountUp from "@/components/CountUp";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="relative overflow-hidden flex flex-col">
      <Header showLinks={true} />

      <main className="container flex-grow mx-auto px-4 pt-16 md:pt-28 relative flex flex-col">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto pb-8 md:pb-12">
          <h1 className="text-3xl md:text-[4rem] lg:text-[4.5rem] xl:text-[5rem] font-medium leading-10 md:leading-20 tracking-tighter mb-8 text-balance">
            Become the most-followed person on Lens, for a day
          </h1>

          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-fit text-lg !ps-12 !pe-10 !py-8 rounded-full font-bold",
            )}
          >
            Sign up
            <LuChevronRight strokeWidth={4} className="signup-icon ml-2 h-5 w-5 scale-x-200 text-accent" />
          </Link>

          <div className="text-sm opacity-65 text-center pt-4">It's totally free to join and use.</div>
        </div>
        <div className="flex-grow flex flex-col justify-end items-center">
          <div className="bg-background w-full max-w-3xl rounded-t-3xl shadow-xl flex flex-col items-center px-6 py-8 md:py-12 gap-2">
            <div className="flex flex-col items-center gap-2">
              <div className="text-lg opacity-45 font-medium">Next winner selected in</div>
              <AnimatedCountdownClock
                targetDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                onComplete={() => alert("done!")}
              />
            </div>

            <div className="text-lg opacity-45 font-medium pt-2">Today's winner</div>

            <div className="flex flex-col items-center gap-1">
              <Avatar className="w-36 h-36">
                <AvatarImage src="/images/dummy_profile_photo.jpeg" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <span className="font-bold">Kai Mercer</span>
                <span className="opacity-65">@VibeCrafter</span>
              </div>
            </div>

            <div className="flex items-center bg-accent rounded-full h-12">
              <span className="bg-neutral-100 rounded-full h-full px-6 flex items-center font-medium">
                Followers gained
              </span>
              <CountUp to={32496} duration={3} className="font-bold pl-4 pr-6" separator="," />
            </div>
          </div>
        </div>
        <div
          className="hidden md:block floating absolute md:top-[24rem] md:left-0 lg:top-96 lg:left-12
             xl:top-96 xl:left-40 2xl:left-80"
        >
          <div className="w-32 h-32 rounded-full overflow-hidden border-8 border-white bg-neutral-300 shadow-lg -rotate-6">
            <img src="/images/dummy_profile_photo-1.jpeg" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
        <div
          className="hidden md:block floating delay absolute md:top-[30rem] md:right-0 lg:top-[30rem] lg:right-16
             xl:top-[30rem] xl:right-48 2xl:right-80"
        >
          <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-white bg-neutral-300 shadow-lg rotate-2">
            <img src="/images/dummy_profile_photo-2.jpeg" alt="Profile" className="w-full h-full object-cover" />
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
