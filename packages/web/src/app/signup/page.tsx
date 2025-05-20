"use client";

import { Button } from "@/src/components/ui/button";
import { useLensSession } from "@/hooks/LensSessionProvider";
import { Account, evmAddress } from "@lens-protocol/react";
import { useReadContract, useSwitchChain, useWalletClient } from "wagmi";
import { accountAbi } from "@/lib/abis/account";
import { EvmAddress } from "@lens-protocol/client";
import { addAccountManager, fetchMeDetails } from "@lens-protocol/client/actions";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { User } from "@/lib/db/tables";
import { createSupabaseClient } from "@/lib/supabase/client";
import { handleOperationWith } from "@lens-protocol/client/viem";
import Lottie from "lottie-react";
import registerAnimation from "@/lib/anim/anim_register.json";
import linkAnimation from "@/lib/anim/anim_link.json";
import usersAnimation from "@/lib/anim/anim_users.json";
import moonwalkAnimation from "@/lib/anim/anim_moonwalk.json";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LuArrowRight, LuKey, LuLoader, LuShieldBan } from "react-icons/lu";
import { FaUserCircle } from "react-icons/fa";
import config from "@/src/config";
import { CiUser } from "react-icons/ci";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

function ConnectWalletSection() {
  const { connectWallet } = useLensSession();

  return (
    <Button size="xl" onClick={connectWallet}>
      <svg fill="none" viewBox="0 0 64 64" className="!w-6 !h-6">
        <path
          fillRule="evenodd"
          d="M42.311 23.793c1.788-1.654 4.133-2.68 6.745-2.68 5.807.002 10.51 4.71 10.51 10.521 0 5.027-4.973 9.326-6.217 10.316-5.815 4.63-13.39 7.339-21.566 7.339-8.176 0-15.749-2.707-21.565-7.34C8.98 40.96 4 36.653 4 31.634c0-5.811 4.705-10.521 10.507-10.521 2.615 0 4.96 1.026 6.748 2.68l.185-.092c.408-5.422 4.817-9.7 10.343-9.7 5.527 0 9.935 4.278 10.344 9.7l.184.091v.002"
          clipRule="evenodd"
          fill="#FFFFFF"
        />
      </svg>
      Log in with Lens
    </Button>
  );
}

function ConnectWalletMessage() {
  return (
    <div className="w-full h-72 flex flex-col items-center justify-center">
      <div className="flex justify-center pb-2">
        <Lottie animationData={usersAnimation} className="w-24 h-24" />
      </div>
      <span className="text-2xl font-medium pb-2">Every day, one user is chosen to be followed by all other users</span>
      <span className="text-base opacity-65 pr-6">The winner is automatically followed and unfollowed for you.</span>
    </div>
  );
}

function LensAccountChooserSection() {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const { accountsAvailable, logIn, error } = useLensSession();

  useEffect(() => {
    if (error) {
      setIsLoggingIn(false);
    }
  }, [error]);

  const handleAccountSelection = async (account: Account) => {
    setSelectedAddress(account.address);
    setIsLoggingIn(true);
    await logIn(account);
    setIsLoggingIn(false);
  };

  return (
    <ScrollArea className=" w-11/12 md:w-3/4 h-72 rounded-xl border bg-background">
      <div className="flex flex-col divide-y">
        {accountsAvailable
          .map(aa => aa.account)
          .sort((a, b) => b.score - a.score)
          .map((account: Account) => (
            <button
              type="button"
              key={account.address}
              disabled={account.score < Number(process.env.NEXT_PUBLIC_LENS_MIN_ACCOUNT_SCORE!)}
              onClick={() => handleAccountSelection(account)}
              className="w-full flex items-center text-start p-3 gap-2 enabled:cursor-pointer enabled:hover:bg-neutral-100
              disabled:opacity-45"
            >
              <Avatar className="flex-none w-10 h-10">
                <AvatarImage src={account.metadata?.picture} alt="Account avatar" />
                <AvatarFallback>
                  <FaUserCircle className="w-10 h-10 opacity-45" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow flex flex-col">
                <span className="text-sm font-semibold">
                  {account.metadata?.name ?? "@" + account.username?.localName}
                </span>
                <span className="text-xs opacity-65">Lens Score: {new Intl.NumberFormat().format(account.score)}</span>
              </div>
              {isLoggingIn && selectedAddress == account.address ? (
                <LuLoader className="animate-spin flex-none opacity-45 w-4 h-4" />
              ) : account.score < Number(process.env.NEXT_PUBLIC_LENS_MIN_ACCOUNT_SCORE!) ? (
                <LuShieldBan className="flex-none w-4 h-4" />
              ) : (
                <LuArrowRight className="flex-none opacity-45 w-4 h-4" />
              )}
            </button>
          ))}
      </div>
    </ScrollArea>
  );
}

function LensAccountChooserMessage() {
  return (
    <>
      <div className="flex justify-center pb-2">
        <Lottie animationData={registerAnimation} className="w-24 h-24" />
      </div>
      <span className="text-2xl font-medium">Choose your Lens account</span>
      <span className="text-base opacity-65 pr-6">
        Accounts must have a Lens Score of{" "}
        {new Intl.NumberFormat().format(Number(process.env.NEXT_PUBLIC_LENS_MIN_ACCOUNT_SCORE!))} or greater to be
        eligible.
      </span>
    </>
  );
}

function AddAccountManagerSection({
  accountAddress,
  setCanExecuteTransactions,
}: {
  accountAddress: EvmAddress;
  setCanExecuteTransactions: Dispatch<SetStateAction<boolean>>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { client, lensUser } = useLensSession();
  const { data: walletClient } = useWalletClient({
    chainId: config.lens.chain.id,
  });

  const {
    data: canExecuteTransactions,
    isLoading,
    refetch,
  } = useReadContract({
    address: accountAddress,
    abi: accountAbi,
    functionName: "canExecuteTransactions",
    args: [process.env.NEXT_PUBLIC_LENS_ACCOUNT_MANAGER_ADDRESS! as `0x${string}`],
  });

  const { switchChain } = useSwitchChain();

  useEffect(() => {
    setCanExecuteTransactions(canExecuteTransactions ?? false);
  }, [canExecuteTransactions]);

  const handleAddAccountManager = async () => {
    if (!client) return;

    setIsSubmitting(true);

    switchChain({ chainId: config.lens.chain.id });

    console.log("handleAddAccountManager: lens client", client, "wallet client", walletClient);

    const res = await addAccountManager(client, {
      address: evmAddress(process.env.NEXT_PUBLIC_LENS_ACCOUNT_MANAGER_ADDRESS!),
      permissions: {
        canExecuteTransactions: true,
        canSetMetadataUri: false,
        canTransferNative: false,
        canTransferTokens: false,
      },
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(client.waitForTransaction);

    if (res.isErr()) {
      console.error("Error adding account manager:", res.error);
      setError("Error adding account manager");
      setIsSubmitting(false);
      return;
    }

    refetch();

    console.log("Account manager added:", res.value);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <LuLoader className="animate-spin opacity-45 w-6 h-6" />;
  }

  if (canExecuteTransactions) {
    return <></>;
  }

  return (
    <Button
      size="xl"
      disabled={isSubmitting}
      onClick={handleAddAccountManager}
      className="flex items-center justify-center gap-2"
    >
      {isSubmitting ? (
        <LuLoader className="animate-spin flex-none opacity-45 w-4 h-4" />
      ) : (
        <LuKey className="w-6 h-6" />
      )}
      Add Account Manager
    </Button>
  );
}

function AddAccountManagerMessage() {
  return (
    <>
      <div className="flex justify-center pb-2">
        <Lottie animationData={linkAnimation} className="w-24 h-24" />
      </div>
      <span className="text-2xl font-medium">Grant permissions for Fameish</span>
      <span className="text-base opacity-65 pr-6">
        This allows us to follow and unfollow on your behalf. The Fameish Manager never has access to your tokens.
      </span>
    </>
  );
}

function CreateUserSection({ accountAddress }: { accountAddress: EvmAddress }) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { client } = useLensSession();

  const router = useRouter();

  const handleCreateUser = async () => {
    if (!client) {
      setError("Please log in again");
      return;
    }

    // Call /me to trigger the session refresh
    await fetchMeDetails(client);

    const creds = client.getCredentials();
    if (creds.isErr()) {
      console.error("createUser: Error getting credentials:", creds.error);
      setError("Error getting credentials");
      return;
    }

    if (!creds.value) {
      setError("No credentials found");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${creds.value.idToken}`,
        },
        body: JSON.stringify({
          account: accountAddress,
        }),
      });
      const data = await res.json();
      console.log("handleCreateUser: POST /api/user : res=", data);
      if (data.success) {
        router.push("/account");
      }
    } catch (e) {
      console.error("createUser: Error creating user:", e);
      setError("Error creating user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 pt-8">
      <Button
        size="xl"
        disabled={isSubmitting}
        onClick={handleCreateUser}
        className="w-fit flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <LuLoader className="animate-spin flex-none opacity-45 w-4 h-4" />
        ) : (
          <CiUser className="w-7 h-7" strokeWidth={1} />
        )}
        Create account
      </Button>
      <div className="text-xs opacity-65 text-center text-balance">
        By creating an account you agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
      </div>
    </div>
  );
}

function CreateUserMessage() {
  return (
    <>
      <div className="flex justify-center pb-2">
        <Lottie animationData={moonwalkAnimation} className="w-24 h-24" />
      </div>
      <span className="text-2xl font-medium">All set!</span>
      <span className="text-base opacity-65 pr-6">
        Creating your account will trigger a follow of today's winner and the{" "}
        <span className="font-semibold">@fameish</span> accounts, and make you eligible to win!
      </span>
    </>
  );
}

export default function Signup() {
  const [user, setUser] = useState<User | null>(null);
  const [canExecuteTransactions, setCanExecuteTransactions] = useState<boolean>(false);

  const { walletAddress, isLoading, lensUser, accountsAvailable } = useLensSession();

  const router = useRouter();

  const supabase = createSupabaseClient();

  const getUser = async (accountAddress: EvmAddress) => {
    const userQuery = supabase.from("user").select().ilike("account", accountAddress).maybeSingle();
    const { data } = await userQuery;
    return data as User;
  };

  useEffect(() => {
    if (!lensUser) return;
    getUser(lensUser.address).then(setUser);
  }, [lensUser]);

  useEffect(() => {
    if (user) {
      router.push("/account");
    }
  }, [user]);

  return (
    <div className="w-full h-full flex flex-col">
      <Header />
      <div className="flex-grow w-full h-full flex justify-center items-center -mt-10">
        <div className="bg-background rounded-2xl shadow-xl w-full max-w-4xl grid md:grid-cols-12 items-center overflow-hidden">
          <div className="w-full h-full p-6 md:col-span-5 flex items-center justify-center px-6 from-neutral-50 bg-gradient-to-l order-2 md:order-1 rounded-l-xl border-t md:border-r border-neutral-100">
            {canExecuteTransactions && lensUser ? (
              <CreateUserSection accountAddress={lensUser.address} />
            ) : lensUser ? (
              <AddAccountManagerSection
                accountAddress={lensUser.address}
                setCanExecuteTransactions={setCanExecuteTransactions}
              />
            ) : walletAddress ? (
              <LensAccountChooserSection />
            ) : (
              <ConnectWalletSection />
            )}
          </div>
          <div className="md:min-h-96 md:col-span-7 p-6 md:p-12 order-1 md:order-2">
            <div className="flex flex-col justify-center gap-2">
              {canExecuteTransactions ? (
                <CreateUserMessage />
              ) : lensUser?.address ? (
                <AddAccountManagerMessage />
              ) : walletAddress ? (
                <LensAccountChooserMessage />
              ) : (
                <ConnectWalletMessage />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
