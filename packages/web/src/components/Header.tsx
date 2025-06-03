import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLensSession } from "@/hooks/LensSessionProvider";
import { useRouter } from "next/navigation";
import AnimatedCountdownClock from "@/components/AnimatedCountdownClock";
import { useReadContract } from "wagmi";
import { fameishAbi } from "@/lib/abis/fameish";
import Image from "next/image";

type HeaderProps = {
  showLinks?: boolean;
};

export default function Header({ showLinks }: HeaderProps) {
  const { walletAddress, lensUser, logOut } = useLensSession();

  const router = useRouter();

  const { data: drawingTimestamp } = useReadContract({
    address: process.env.NEXT_PUBLIC_FAMEISH_CONTRACT_ADDRESS! as `0x${string}`,
    abi: fameishAbi,
    functionName: "winnerSetTimestamp",
  });

  const handleLogout = async () => {
    await logOut();
    router.push("/");
  };

  return (
    <header className="w-full px-6 py-4 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center">
      <Link href="/" className={`${!showLinks && "md:opacity-45"}`}>
        <Image src="images/fameish-logo.svg" alt="Fameish logo" width={1454} height={367} className="h-7 w-auto" />
      </Link>

      {showLinks ? (
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/signup" className="text-gray-700 hover:text-black">
            How it works
          </Link>
          <Link href="#" className="text-gray-700 hover:text-black">
            Terms of service
          </Link>
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

      <div className="flex items-center justify-end gap-x-6">
        {lensUser ? (
          showLinks ? (
            <Link href="/account" className="font-medium">
              Account
            </Link>
          ) : (
            <Button variant="link" onClick={handleLogout} className="opacity-65 p-0">
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
    </header>
  );
}
