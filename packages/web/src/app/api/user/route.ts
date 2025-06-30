import supabase from "@/lib/supabase/admin";
import publicClient from "@/lib/viem/publicClient";
import { accountAbi } from "@/lib/abis/account";
import { graphAbi } from "@/lib/abis/graph";
import { getContract } from "@/lib/lens/contracts";
import { fameishAbi } from "@/lib/abis/fameish";
import { fetchAccount } from "@lens-protocol/client/actions";
import { lensClient } from "@/lib/lens/server";
import { walletClient } from "@/lib/viem/walletClient";
import { ZeroAddress } from "@/lib/utils";
import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { lensReputationAbi } from "@/lib/abis/lensReputation";
import { track } from "@vercel/analytics/server";
import { createUser, fetchUserByAccountAddress, VerificationSource } from "@/operations/user";

const jwksUri = process.env.LENS_JWKS_URI!;
const JWKS = createRemoteJWKSet(new URL(jwksUri));

const unauthorizedResponse = Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

export async function POST(req: Request) {
  let signer: string | null = null;
  let act: string | null = null;

  // when running in production, we verify the JWT and extract the signer and act in middleware
  if (process.env.VERCEL_ENV === "production") {
    if (process.env.MIDDLEWARE_SECRET !== req.headers.get("x-secret")) {
      console.error("POST /user : Invalid middleware secret");
      return unauthorizedResponse;
    }

    signer = req.headers.get("x-user-sub");
    act = req.headers.get("x-user-act");

    if (!signer || !act) {
      console.error("POST /user : Missing signer or act in headers", { signer, act });
      return unauthorizedResponse;
    }
  }

  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    console.error("POST /user : Missing authorization token");
    return unauthorizedResponse;
  }

  let accountFromJwt: string | null = null;
  try {
    const { payload } = await jwtVerify(token, JWKS);
    const { sub, act } = payload;

    if (!sub || typeof sub !== "string") {
      console.error("Missing authorization subject header in payload", payload);
      return new NextResponse("Forbidden", { status: 403 });
    }
    signer = sub;
    accountFromJwt = (act as { sub: string }).sub;
  } catch (e) {
    console.error("JWT verification failed", e);
    return unauthorizedResponse;
  }

  if (!signer || !accountFromJwt) {
    console.error("POST /user : Missing signer or accountFromJwt", { signer, accountFromJwt });
    return unauthorizedResponse;
  }

  const body = await req.json();

  const accountAddress = body.account as `0x${string}`;
  if (!accountAddress) {
    return Response.json({ success: false, message: "Invalid account" }, { status: 400 });
  }

  if (accountAddress.toLowerCase() !== accountFromJwt.toLowerCase()) {
    console.error("POST /user : JWT account does not match provided account", {
      jwtAccount: accountFromJwt,
      providedAccount: accountAddress,
    });
    return unauthorizedResponse;
  }

  console.log("POST /user : ✓ JWT verified for ", accountAddress);

  let verificationSource: VerificationSource | null = null;
  try {
    // check that the account has a score above the threshold
    const getAccountRes = await fetchAccount(lensClient, {
      address: accountAddress,
    });
    if (getAccountRes.isErr()) {
      console.error("POST /user : getAccountRes", getAccountRes.error);
      return Response.json({ success: false, message: "Failed to fetch account" }, { status: 500 });
    }
    const account = getAccountRes.value;
    if (!account) {
      console.error("POST /user : account not found for", accountAddress);
      return Response.json({ success: false, message: "Account not found" }, { status: 401 });
    }

    if (account.score < Number(process.env.NEXT_PUBLIC_LENS_MIN_ACCOUNT_SCORE!)) {
      console.log(
        "POST /user : ✕ Account Score",
        account.score,
        "too low for",
        accountAddress,
        "checking Lens Reputation Score...",
      );
      let lensRepScore = 0n;
      try {
        const { score } = await publicClient.readContract({
          address: process.env.NEXT_PUBLIC_LENS_REP_ADDRESS! as `0x${string}`,
          abi: lensReputationAbi,
          functionName: "getScoreByAddress",
          args: [account.owner, account.address],
        });
        lensRepScore = score;
      } catch (e) {
        console.error("POST /user : Error getting Lens Reputation Score", e);
      }

      if (lensRepScore < BigInt(process.env.NEXT_PUBLIC_MIN_LENS_REP_SCORE!)) {
        console.log(
          "POST /user : ✕ Lens Reputation Score",
          lensRepScore,
          "too low for",
          accountAddress,
          "score:",
          lensRepScore.toString(),
        );
        return Response.json({ success: false, message: "Scores are too low" }, { status: 401 });
      }

      verificationSource = VerificationSource.LENS_REPUTATION;
      console.log("POST /user : ✓ Lens Reputation Score verified for", accountAddress);
      await track("User Verified", {
        method: "Lens Reputation",
        account: accountAddress,
        lensRepScore: lensRepScore.toString(),
      });
    } else {
      verificationSource = VerificationSource.ACCOUNT_SCORE;
      console.log("POST /user : ✓ Account Score verified for", accountAddress);
      await track("User Verified", {
        method: "Account Score",
        account: accountAddress,
        accountScore: account.score,
      });
    }

    const canExecuteTransactions = await publicClient.multicall({
      contracts: [
        {
          address: accountAddress,
          abi: accountAbi,
          functionName: "canExecuteTransactions",
          args: [signer as `0x${string}`],
        },
        {
          address: accountAddress,
          abi: accountAbi,
          functionName: "canExecuteTransactions",
          args: [process.env.NEXT_PUBLIC_FAMEISH_CONTRACT_ADDRESS! as `0x${string}`],
        },
      ],
    });

    // Check if the signer is the owner or the manager of the account
    if (canExecuteTransactions[0].error || !canExecuteTransactions[0].result) {
      console.error("POST /user : signer is not a manager for", accountAddress);
      throw new Error("Signer is not a manager");
    }

    // Check if the Fameish Account Manager is a manager of the account
    if (canExecuteTransactions[1].error || !canExecuteTransactions[1].result) {
      console.error("POST /user : Fameish is not a manager for", accountAddress);
      throw new Error("Fameish is not a manager of the account");
    }

    console.log("POST /user : ✓ Account managers verified for", accountAddress);

    // Check if the user already exists
    const userData = await fetchUserByAccountAddress(supabase, accountAddress);
    if (userData) {
      return Response.json({ success: false, message: "Account already exists" }, { status: 409 });
    }

    console.log("POST /user : ✓ New user verified for", accountAddress);

    const winnerAccount = await publicClient.readContract({
      address: process.env.NEXT_PUBLIC_FAMEISH_CONTRACT_ADDRESS! as `0x${string}`,
      abi: fameishAbi,
      functionName: "winner",
    });
    const winnerExists = winnerAccount && winnerAccount !== ZeroAddress;

    const isFollowing = await publicClient.multicall({
      contracts: [
        {
          address: getContract("LensGlobalGraph").address,
          abi: graphAbi,
          functionName: "isFollowing",
          args: [accountAddress, process.env.NEXT_PUBLIC_LENS_FAMEISH_ACCOUNT_ADDRESS! as `0x${string}`],
        },
        {
          address: getContract("LensGlobalGraph").address,
          abi: graphAbi,
          functionName: "isFollowing",
          args: [accountAddress, winnerAccount],
        },
      ],
    });

    if (isFollowing[0].error || (winnerExists && isFollowing[1].error)) {
      console.error("POST /user : unable to get follow status for", accountAddress);
      return Response.json({ success: false, message: "Unable to get follow status" }, { status: 500 });
    }

    // Ensure the account is following the Fameish account
    if (!isFollowing[0].result) {
      console.error(`POST /user : ${accountAddress} not following Fameish account`);
      return Response.json({ success: false, message: "Not following Fameish account" }, { status: 500 });
    }

    // Ensure the account is following the winning account
    if (winnerExists && !isFollowing[1].result) {
      try {
        const { request } = await walletClient.simulateContract({
          address: process.env.NEXT_PUBLIC_FAMEISH_CONTRACT_ADDRESS! as `0x${string}`,
          abi: fameishAbi,
          functionName: "bulkFollow",
          args: [[accountAddress]],
        });
        await walletClient.writeContract(request);
      } catch (e) {
        console.error(`POST /user : failed to follow winning account for ${accountAddress}`, e);
        return Response.json(
          { success: false, message: `Failed to follow wining account for ${accountAddress}` },
          { status: 500 },
        );
      }
    }

    console.log("POST /user : ✓ Following status verified");

    // create a new user record
    const { data: insertData, error: insertError } = await createUser(supabase, accountAddress, verificationSource);

    if (insertError) {
      console.error(`POST /user : insertError for ${accountAddress}`, insertError);
      return Response.json({ success: false, message: "Failed to create user" }, { status: 500 });
    }

    console.log("POST /user : ✓ Created user", insertData?.id);

    return Response.json({ success: true, user: insertData });
  } catch (e) {
    console.error("POST /user : error", e);
    return unauthorizedResponse;
  }
}
