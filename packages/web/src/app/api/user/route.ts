import { createRemoteJWKSet, jwtVerify } from "jose";
import supabase from "@/lib/supabase/admin";
import publicClient from "@/lib/viem/publicClient";
import { accountAbi } from "@/lib/abis/account";
import { graphAbi } from "@/lib/abis/graph";
import { getContract } from "@/lib/lens/contracts";
import { fameishAbi } from "@/lib/abis/fameish";
import { fetchAccount } from "@lens-protocol/client/actions";
import { lensClient } from "@/lib/lens/server";
import { encodeFunctionData } from "viem";
import { walletClient } from "@/lib/viem/walletClient";
import { privateKeyToAccount } from "viem/accounts";

const jwksUri = process.env.LENS_JWKS_URI!;

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];

  if (!token) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const body = await req.json();
  console.log("POST /user : body", body);
  const accountAddress = body.account as `0x${string}`;
  if (!accountAddress) {
    return new Response("Invalid account", {
      status: 400,
    });
  }

  try {
    const JWKS = createRemoteJWKSet(new URL(jwksUri));
    const { payload } = await jwtVerify(token, JWKS);
    console.log("POST /user : JWT payload", payload);
    const { sub: signer, act } = payload;

    if (act && typeof act === "string" && accountAddress.toLowerCase() !== act.toLowerCase()) {
      throw new Error("JWT verification failed"); // returns 401 Unauthorized
    }

    console.log("POST /user : ✓ JWT verified");

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
    if (!account || account.score < Number(process.env.NEXT_PUBLIC_LENS_MIN_ACCOUNT_SCORE!)) {
      return new Response("Account score is too low", {
        status: 401,
      });
    }

    console.log("POST /user : ✓ Score verified");

    // const isSignerOwnerOrManager = await publicClient.readContract({
    //   address: account as `0x${string}`,
    //   abi: accountAbi,
    //   functionName: "canExecuteTransactions",
    //   args: [signer as `0x${string}`],
    // });

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
          args: [process.env.NEXT_PUBLIC_LENS_ACCOUNT_MANAGER_ADDRESS! as `0x${string}`],
        },
      ],
    });

    // Check if the signer is the owner or the manager of the account
    if (canExecuteTransactions[0].error || !canExecuteTransactions[0].result) {
      throw new Error("Signer is not a manager"); // returns 401 Unauthorized
    }

    // Check if the Fameish Account Manager is a manager of the account
    if (canExecuteTransactions[1].error || !canExecuteTransactions[1].result) {
      return new Response("Fameish is not a manager of the account", {
        status: 401,
      });
    }

    console.log("POST /user : ✓ Account managers verified");

    // Check if the user already exists
    const userQuery = supabase.from("user").select().ilike("account", accountAddress).single();
    const { data: userData } = await userQuery;
    if (userData) {
      return new Response("Account already exists", {
        status: 409,
      });
    }

    console.log("POST /user : ✓ New user verified");

    const winnerAccount = await publicClient.readContract({
      address: process.env.FAMEISH_CONTRACT_ADDRESS! as `0x${string}`,
      abi: fameishAbi,
      functionName: "winner",
    });

    const isFollowing = await publicClient.multicall({
      contracts: [
        {
          address: getContract("LensGlobalGraph").address,
          abi: graphAbi,
          functionName: "isFollowing",
          args: [accountAddress, winnerAccount],
        },
        {
          address: getContract("LensGlobalGraph").address,
          abi: graphAbi,
          functionName: "isFollowing",
          args: [accountAddress, process.env.NEXT_PUBLIC_LENS_FAMEISH_ACCOUNT_ADDRESS! as `0x${string}`],
        },
      ],
    });

    if (isFollowing[0].error || isFollowing[1].error) {
      return new Response("Unable to get follow status", {
        status: 500,
      });
    }

    const followCalls: {
      target: `0x${string}`;
      value: bigint;
      data: `0x${string}`;
    }[] = [];

    // Ensure the account is following the winning account
    if (!isFollowing[0].result) {
      const followWinnerData = encodeFunctionData({
        abi: graphAbi,
        functionName: "follow",
        args: [accountAddress, winnerAccount, [], [], [], []],
      });
      followCalls.push({
        target: getContract("LensGlobalGraph").address,
        value: 0n,
        data: followWinnerData,
      });
    }

    // Ensure the account is following the Fameish account
    if (!isFollowing[1].result) {
      const followFameishData = encodeFunctionData({
        abi: graphAbi,
        functionName: "follow",
        args: [accountAddress, process.env.NEXT_PUBLIC_LENS_FAMEISH_ACCOUNT_ADDRESS! as `0x${string}`, [], [], [], []],
      });
      followCalls.push({
        target: getContract("LensGlobalGraph").address,
        value: 0n,
        data: followFameishData,
      });
    }

    console.log("executeTransactions with client", walletClient.account.address);

    if (followCalls.length) {
      try {
        const accountManagerAccount = privateKeyToAccount(
          process.env.LENS_ACCOUNT_MANAGER_PRIVATE_KEY! as `0x${string}`,
        );
        const { request } = await publicClient.simulateContract({
          account: accountManagerAccount,
          address: accountAddress,
          abi: accountAbi,
          functionName: "executeTransactions",
          args: [followCalls],
        });
        await walletClient.writeContract(request);
      } catch (e) {
        console.error(e);
        return new Response("Failed to follow accounts", {
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
      console.error("POST /user : insertError", insertError);
      return new Response("Failed to create user", {
        status: 500,
      });
    }

    console.log("POST /user : ✓ Created user");

    return Response.json({ success: true, user: insertData });
  } catch (e) {
    console.error("POST /user error", e);
    return new Response("Unauthorized", {
      status: 401,
    });
  }
}
