"use client";

import { Button } from "@/src/components/ui/button";
import { useLensSession } from "@/hooks/useLensSession";
import { Account, evmAddress, useAccount } from "@lens-protocol/react";
import { useReadContract, useReadContracts, useSwitchChain, useWalletClient } from "wagmi";
import { accountAbi } from "@/lib/abis/account";
import { EvmAddress } from "@lens-protocol/client";
import { addAccountManager, fetchMeDetails, follow } from "@lens-protocol/client/actions";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { handleOperationWith } from "@lens-protocol/client/viem";
import Lottie from "lottie-react";
import registerAnimation from "@/lib/anim/anim_register.json";
import linkAnimation from "@/lib/anim/anim_link.json";
import usersAnimation from "@/lib/anim/anim_users.json";
import moonwalkAnimation from "@/lib/anim/anim_moonwalk.json";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LuArrowRight, LuKey, LuLoader, LuShieldBan } from "react-icons/lu";
import { FaExternalLinkAlt, FaUserCircle } from "react-icons/fa";
import config from "@/src/config";
import { CiUser } from "react-icons/ci";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { track } from "@vercel/analytics";
import { lensReputationAbi } from "@/lib/abis/lensReputation";
import Image from "next/image";
import { toast } from "sonner";
import { useSupabase } from "@/hooks/useSupabase";
import { fetchUserByAccountAddress } from "@/operations/user";

function ConnectWalletSection() {
  const { connectWallet } = useLensSession();

  const handleLogin = () => {
    track("Click", { name: "Log in", location: "Signup" });
    connectWallet();
  };

  return (
    <Button size="xl" onClick={handleLogin}>
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
      <span className="text-2xl font-medium pb-2 text-center md:text-start">
        Every day, one user is chosen to be followed by all other users
      </span>
      <span className="text-base opacity-65 pr-6 text-center md:text-start">
        The winner is automatically followed and unfollowed for you.
      </span>
    </div>
  );
}

function LensAccountChooserSection() {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lensRepScoreMap, setLensRepScoreMap] = useState<Record<string, bigint>>({});
  const [ownedAccounts, setOwnedAccounts] = useState<Account[]>([]);

  const { accountsAvailable, walletAddress, logIn, error } = useLensSession();

  const lensReputationContract = {
    address: process.env.NEXT_PUBLIC_LENS_REP_ADDRESS! as `0x${string}`,
    abi: lensReputationAbi,
  } as const;

  const { data: lensReputationScores, isLoading: lensReputationScoresLoading } = useReadContracts({
    contracts: ownedAccounts.map(account => ({
      ...lensReputationContract,
      functionName: "getScoreByAddress",
      args: [account.owner, account.address],
    })),
  });

  useEffect(() => {
    if (error) {
      setIsLoggingIn(false);
    }
  }, [error]);

  useEffect(() => {
    const owned = accountsAvailable.filter(aa => aa.__typename === "AccountOwned").map(aa => aa.account);
    setOwnedAccounts(owned);
  }, [accountsAvailable]);

  const handleAccountSelection = async (account: Account) => {
    setSelectedAddress(account.address);
    setIsLoggingIn(true);
    await logIn(account);
    setIsLoggingIn(false);
  };

  useEffect(() => {
    if (!ownedAccounts?.length || !walletAddress) return;
    const eligibleAccounts = ownedAccounts.filter(
      account => account.score >= Number(process.env.NEXT_PUBLIC_LENS_MIN_ACCOUNT_SCORE!),
    );
    if (eligibleAccounts.length === 0) {
      track("Ineligible User", { walletAddress });
    }
  }, [ownedAccounts, walletAddress]);

  useEffect(() => {
    if (!lensReputationScores || lensReputationScoresLoading) return;
    const scoresMap: Record<string, bigint> = {};
    lensReputationScores.forEach((score, index) => {
      const account = ownedAccounts[index];
      if (account) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scoresMap[account.address] = score ? (score.result as any).score : 0n;
      }
    });
    console.log("Lens Reputation Scores:", scoresMap);
    setLensRepScoreMap(scoresMap);
  }, [lensReputationScores, lensReputationScoresLoading, ownedAccounts]);

  const isAccountEligible = useCallback(
    (account: Account) => {
      return (
        account.score >= Number(process.env.NEXT_PUBLIC_LENS_MIN_ACCOUNT_SCORE!) ||
        lensRepScoreMap[account.address] >= BigInt(process.env.NEXT_PUBLIC_MIN_LENS_REP_SCORE!)
      );
    },
    [lensRepScoreMap],
  );

  return (
    <ScrollArea className="w-11/12 md:w-3/4 h-72 rounded-xl border bg-background">
      <div className="flex flex-col divide-y border-b">
        {ownedAccounts.length ? (
          ownedAccounts
            .sort((a, b) => b.score - a.score)
            .map((account: Account) => (
              <button
                type="button"
                key={account.address}
                disabled={!isAccountEligible(account) || isLoggingIn}
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
                  <div className="flex gap-1 items-center">
                    <span className="text-sm font-semibold">
                      {account.metadata?.name ?? "@" + account.username?.localName}
                    </span>
                    {lensRepScoreMap[account.address] > 0n && (
                      <Image
                        src="/images/lens-reputation.png"
                        alt="Lens Reputation"
                        width={16}
                        height={16}
                        title={`Lens Reputation Score: ${lensRepScoreMap[account.address] || 0}`}
                        className="w-4 h-4"
                      />
                    )}
                  </div>
                  <span className="text-xs opacity-65">
                    Lens Score: {new Intl.NumberFormat().format(account.score)}
                  </span>
                </div>
                {isLoggingIn && selectedAddress == account.address ? (
                  <LuLoader className="animate-spin flex-none opacity-45 w-4 h-4" />
                ) : !isAccountEligible(account) ? (
                  <LuShieldBan className="flex-none w-4 h-4" />
                ) : (
                  <LuArrowRight className="flex-none opacity-45 w-4 h-4" />
                )}
              </button>
            ))
        ) : (
          <div className="flex w-full h-72 items-center justify-center text-sm opacity-65">Unable to load accounts</div>
        )}
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
      <span className="text-2xl font-medium text-center md:text-start">Choose your Lens account</span>
      <span className="text-base opacity-65 pr-6 text-center md:text-start">
        Accounts must have a Lens Score of{" "}
        {new Intl.NumberFormat().format(Number(process.env.NEXT_PUBLIC_LENS_MIN_ACCOUNT_SCORE!))} or greater, or a{" "}
        <a href="https://lensreputation.xyz?referral=RYEBL1MG" target="_blank" className="inline-flex items-baseline">
          <Image
            src="/images/lens-reputation.png"
            alt="Lens Reputation"
            width={16}
            height={16}
            className="inline-block mr-1"
          />
          Lens Reputation
        </a>{" "}
        Score over {process.env.NEXT_PUBLIC_MIN_LENS_REP_SCORE!} to be eligible.
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
  const [, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { client } = useLensSession();
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
    args: [process.env.NEXT_PUBLIC_FAMEISH_CONTRACT_ADDRESS! as `0x${string}`],
  });

  const { switchChain } = useSwitchChain();

  useEffect(() => {
    setCanExecuteTransactions(canExecuteTransactions ?? false);
  }, [canExecuteTransactions, setCanExecuteTransactions]);

  const handleAddAccountManager = async () => {
    if (!client) return;

    setIsSubmitting(true);

    switchChain({ chainId: config.lens.chain.id });

    console.log("handleAddAccountManager: lens client", client, "wallet client", walletClient);

    if (!client.isSessionClient()) {
      setError("Please log in again");
      setIsSubmitting(false);
      return;
    }

    const res = await addAccountManager(client, {
      address: evmAddress(process.env.NEXT_PUBLIC_FAMEISH_CONTRACT_ADDRESS!),
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
      <span className="text-2xl font-medium text-center md:text-start">Grant permissions for Fameish</span>
      <span className="text-base opacity-65 pr-6 text-center md:text-start">
        This allows us to follow and unfollow on your behalf. The Fameish Manager is{" "}
        <a href="https://github.com/iPaulPro/fameish" target="_blank">
          open source <FaExternalLinkAlt className="inline w-2 h-2" />
        </a>{" "}
        and never has access to your tokens.
      </span>
    </>
  );
}

function CreateUserSection({ accountAddress }: { accountAddress: EvmAddress }) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowingFameish, setIsFollowingFameish] = useState(false);

  const { client } = useLensSession();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  const { data: fameishAccount } = useAccount({
    address: process.env.NEXT_PUBLIC_LENS_FAMEISH_ACCOUNT_ADDRESS! as `0x${string}`,
  });

  useEffect(() => {
    if (!fameishAccount) return;
    setIsFollowingFameish(fameishAccount.operations?.isFollowedByMe == true);
  }, [fameishAccount]);

  const handleCreateUser = async () => {
    if (!client.isSessionClient()) {
      setError("Please log in again");
      return;
    }

    setIsSubmitting(true);

    // Call /me to trigger the session refresh
    await fetchMeDetails(client);

    if (!isFollowingFameish) {
      const res = await follow(client, {
        account: evmAddress(process.env.NEXT_PUBLIC_LENS_FAMEISH_ACCOUNT_ADDRESS!),
      })
        .andThen(handleOperationWith(walletClient))
        .andThen(client.waitForTransaction);

      if (res.isErr()) {
        console.error("createUser: Error following Fameish account:", res.error);
        setError("Error following Fameish account");
        setIsSubmitting(false);
        return;
      }
    }

    const creds = client.getCredentials();
    if (creds.isErr()) {
      console.error("createUser: Error getting credentials:", creds.error);
      setError("Error getting credentials");
      setIsSubmitting(false);
      return;
    }

    if (!creds.value) {
      setError("No credentials found");
      setIsSubmitting(false);
      return;
    }

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

  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error]);

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
        By creating an account you agree to the <a href="/p/terms">Terms of Service</a> and{" "}
        <a href="/p/privacy">Privacy Policy</a>
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
      <span className="text-2xl font-medium text-center md:text-start">All set!</span>
      <span className="text-base opacity-65 pr-6 text-center md:text-start">
        Creating your account will trigger a follow of today&apos;s winner and the{" "}
        <span className="font-semibold">@fameish</span> accounts, and make you eligible to win!
      </span>
    </>
  );
}

export default function Signup() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [canExecuteTransactions, setCanExecuteTransactions] = useState<boolean>(false);

  const { walletAddress, lensUser, isLoading: sessionLoading } = useLensSession();
  const { client: supabase } = useSupabase();

  const router = useRouter();

  const updateUser = useCallback(
    async (accountAddress: string) => {
      setIsLoading(true);
      const { data, error } = await fetchUserByAccountAddress(supabase, accountAddress);
      if (error) {
        setError("Unable to get user details");
        setIsLoading(false);
        return;
      }
      if (data) {
        router.push("/account");
      } else {
        setIsLoading(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    console.log("lensUser", lensUser);
    if (!lensUser) {
      setIsLoading(sessionLoading);
      return;
    }
    updateUser(lensUser.address);
  }, [lensUser, updateUser, sessionLoading]);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error]);

  return (
    <div className="w-full flex-grow flex flex-col">
      <Header />
      <div className="flex-grow w-full h-full flex justify-center items-center -mt-10">
        <div className="bg-background rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden">
          {isLoading ? (
            <div className="min-h-96 w-full flex items-center justify-center">
              <LuLoader className="animate-spin flex-none opacity-45 w-6 h-6" />
            </div>
          ) : (
            <div className="grid md:grid-cols-12 items-center ">
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
          )}
        </div>
      </div>
    </div>
  );
}
