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

const jwksUri = process.env.LENS_JWKS_URI!;
const JWKS = createRemoteJWKSet(new URL(jwksUri));

export async function POST(req: Request) {
  let signer: string | null = null;
  let act: string | null = null;

  // when running in production, we verify the JWT and extract the signer and act in middleware
  if (process.env.VERCEL_ENV === "production") {
    if (process.env.MIDDLEWARE_SECRET !== req.headers.get("x-secret")) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    signer = req.headers.get("x-user-sub");
    act = req.headers.get("x-user-act");

    if (!signer || !act) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }
  }

  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    console.error("POST /user : Missing authorization token");
    return new NextResponse("Unauthorized", {
      status: 401,
    });
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
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  if (!signer || !accountFromJwt) {
    console.error("POST /user : Missing signer or accountFromJwt", { signer, accountFromJwt });
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const body = await req.json();

  const accountAddress = body.account as `0x${string}`;
  if (!accountAddress) {
    return new Response("Invalid account", {
      status: 400,
    });
  }

  if (accountAddress.toLowerCase() !== accountFromJwt.toLowerCase()) {
    console.error("POST /user : JWT account does not match provided account", {
      jwtAccount: accountFromJwt,
      providedAccount: accountAddress,
    });
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  console.log("POST /user : ✓ JWT verified for ", accountAddress);

  try {
    // check that the account has a score above the threshold
    const getAccountRes = await fetchAccount(lensClient, {
      address: accountAddress,
    });
    if (getAccountRes.isErr()) {
      console.error("POST /user : getAccountRes", getAccountRes.error);
      return new Response("Failed to fetch account", {
        status: 500,
      });
    }
    const account = getAccountRes.value;
    if (!account) {
      console.error("POST /user : account not found for", accountAddress);
      return new Response("Account not found", {
        status: 401,
      });
    }

    if (account.score < Number(process.env.NEXT_PUBLIC_LENS_MIN_ACCOUNT_SCORE!)) {
      console.log("POST /user : ✕ Account Score too low for", accountAddress, "checking Lens Reputation Score...");
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
        return new Response("Scores are too low", {
          status: 401,
        });
      }
      console.log("POST /user : ✓ Lens Reputation Score verified for", accountAddress);
    } else {
      console.log("POST /user : ✓ Account Score verified for", accountAddress);
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
    const userQuery = supabase.from("user").select().ilike("account", accountAddress).single();
    const { data: userData } = await userQuery;
    if (userData) {
      return new Response("Account already exists", {
        status: 409,
      });
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
      return new Response("Unable to get follow status", {
        status: 500,
      });
    }

    // Ensure the account is following the Fameish account
    if (!isFollowing[0].result) {
      console.error(`POST /user : ${accountAddress} not following Fameish account`);
      return new Response("Not following Fameish account", {
        status: 500,
      });
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
        return new Response(`Failed to follow wining account for ${accountAddress}`, {
          status: 500,
        });
      }
    }

    console.log("POST /user : ✓ Following status verified");

    // create a new user
    const { data: insertData, error: insertError } = await supabase
      .from("user")
      .insert({ account: accountAddress })
      .select()
      .single();

    if (insertError) {
      console.error(`POST /user : insertError for ${accountAddress}`, insertError);
      return new Response("Failed to create user", {
        status: 500,
      });
    }

    console.log("POST /user : ✓ Created user");

    return Response.json({ success: true, user: insertData });
  } catch (e) {
    console.error("POST /user : error", e);
    return new Response("Unauthorized", {
      status: 401,
    });
  }
}
