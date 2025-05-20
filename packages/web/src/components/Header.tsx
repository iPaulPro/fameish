import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLensSession } from "@/hooks/LensSessionProvider";
import { useRouter } from "next/navigation";

type HeaderProps = {
  showLinks?: boolean;
};

export default function Header({ showLinks }: HeaderProps) {
  const { walletAddress, lensUser, logOut } = useLensSession();

  const router = useRouter();

  return (
    <header className="w-full px-6 py-4 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center">
      <span
        onClick={() => router.push("/")}
        className={`font-damion text-4xl cursor-pointer ${!showLinks && "opacity-45"}`}
      >
        Fameish
      </span>

      {showLinks ? (
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="#" className="text-gray-700 hover:text-black">
            How it works
          </Link>
          <Link href="#" className="text-gray-700 hover:text-black">
            Terms of service
          </Link>
        </nav>
      ) : (
        <div className="hidden md:block"></div>
      )}

      <div className="flex items-center justify-end gap-x-6">
        {lensUser ? (
          showLinks ? (
            <Link href="/account" className="font-medium">
              Account
            </Link>
          ) : (
            <Button variant="link" onClick={logOut}>
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
