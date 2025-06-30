import AnimatedCountdownClock from "@/components/AnimatedCountdownClock";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaUserCircle } from "react-icons/fa";
import CountUp from "@/components/CountUp";
import { useReadContract } from "wagmi";
import { fameishAbi } from "@/lib/abis/fameish";
import { useCallback, useEffect, useState } from "react";
import { fetchAccount } from "@lens-protocol/client/actions";
import { lensClient } from "@/lib/lens/client";
import { Account } from "@lens-protocol/react";
import { LuLoader } from "react-icons/lu";
import { ZeroAddress } from "@/lib/utils";
import { useSupabase } from "@/hooks/useSupabase";
import { getUserCount } from "@/operations/recordCount";

type LandingCardProps = {
  winnerAddress: string;
};

export default function LandingCard({ winnerAddress }: LandingCardProps) {
  const [userCount, setUserCount] = useState<number>(0);
  const [winnerAccount, setWinnerAccount] = useState<Account | undefined>(undefined);

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

  const { client: supabase } = useSupabase();

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

  const updateUserCount = useCallback(async () => {
    try {
      const count = await getUserCount(supabase);
      setUserCount(count);
    } catch (e) {
      console.error("Error fetching user count:", e);
    }
  }, [supabase]);

  useEffect(() => {
    updateUserCount();
  }, [updateUserCount]);

  return (
    <div className="flex flex-col items-center gap-2 pb-8">
      {isTimestampLoading ? (
        <div className="flex flex-grow items-center justify-center h-16">
          <LuLoader className="animate-spin flex-none opacity-45 w-4 h-4" />
        </div>
      ) : (
        drawingTimestamp &&
        drawingTimestamp > 0 && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg opacity-45 font-medium">Next winner selected in</div>
            <AnimatedCountdownClock targetDate={new Date(Number(drawingTimestamp) * 1000 + 86400000)} />
          </div>
        )
      )}

      {winnerAccount && winnerAccount?.address !== ZeroAddress && (
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
            <span className="bg-neutral-100 rounded-full h-full px-6 flex items-center font-medium border">
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
  );
}
