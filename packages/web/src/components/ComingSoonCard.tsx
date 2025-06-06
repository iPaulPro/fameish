import { createSupabaseClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";
import SemiCircleProgressBar from "@/components/SemiCircleProgressBar";
import { Button } from "@/components/ui/button";
import CountUp from "@/components/CountUp";
import { track } from "@vercel/analytics";

export default function ComingSoonCard() {
  const minUserCount = Number(process.env.NEXT_PUBLIC_LENS_USER_COUNT_MIN!);
  const [userCount, setUserCount] = useState<number>(0);

  const supabase = createSupabaseClient();

  const handleRecordUpdated = (payload: { new: { count: number } }) => {
    console.log("Record updated:", payload);
    if (payload.new.count) {
      setUserCount(payload.new.count);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("userCount")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "record_count", filter: "table_name=eq.user" },
        handleRecordUpdated,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const updateUserCount = useCallback(async () => {
    const { data, error } = await supabase.from("record_count").select().eq("table_name", "user").limit(1).single();
    if (error) {
      console.error("Error fetching user count:", error);
      return;
    }
    if (data) {
      setUserCount(data.count);
    }
  }, [supabase]);

  useEffect(() => {
    updateUserCount();
  }, [updateUserCount]);

  const shareText = `Want to be the most followed account on Lens? Check out **Fameish**!
  %0A%0AEach day one member is chosen to be followed by all other users for 24 hours. Sign up for free now!`;

  return (
    <div className="flex flex-col items-center flex-none justify-between">
      <div className="flex flex-col items-center gap-2 pb-8">
        <span className="text-xl sm:text-[1.7rem] font-medium md:px-24 text-center text-balance">
          The first winner will be selected once <span className="font-black">{minUserCount}</span> users have joined!
        </span>
        <span className="opacity-45">Then the 24-hour cycle will begin</span>
      </div>
      <div className="w-full sm:px-12 relative flex flex-col items-end">
        <SemiCircleProgressBar max={minUserCount} value={userCount} thickness={20} className="w-full" />
        <div className="absolute inset-0">
          <div className="flex flex-col items-center justify-center h-full text-4xl font-hero pt-10 sm:pt-16">
            <CountUp to={userCount} duration={1} className="font-semibold text-balance text-4xl sm:text-7xl"></CountUp>
            <span className="opacity-45 text-sm sm:text-lg">users joined so far</span>
            <Button
              variant="outline"
              size="lg"
              className="mt-4 hidden md:block"
              onClick={() => {
                track("Click", { name: "Share on Lens", location: "Home" });
                window.open(`https://hey.xyz/?text=${shareText}&url=https://fameish.day`, "_blank");
              }}
            >
              Share on Lens
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
