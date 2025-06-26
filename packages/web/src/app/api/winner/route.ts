import supabase from "@/lib/supabase/admin";
import { StorageClient, immutable } from "@lens-chain/storage-client";
import { fetchFollowStatus } from "@lens-protocol/client/actions";
import config from "@/src/config";
import { walletClient } from "@/lib/viem/walletClient";
import { privateKeyToAccount } from "viem/accounts";
import { fameishAbi } from "@/lib/abis/fameish";
import { lensClient } from "@/lib/lens/server";
import { EvmAddress } from "@lens-protocol/client";
import { graphAbi } from "@/lib/abis/graph";
import { getContract } from "@/lib/lens/contracts";
import { encodeFunctionData } from "viem";
import { accountAbi } from "@/lib/abis/account";
import { TablesUpdate } from "@/database.types";

const ZeroAddress = "0x0000000000000000000000000000000000000000";

const fameishAddress = process.env.NEXT_PUBLIC_FAMEISH_CONTRACT_ADDRESS! as `0x${string}`;

export async function GET(request: Request) {
  // https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  // TODO pagination
  const { data, error } = await supabase.from("user").select("account,should_unfollow").eq("eligible", true);

  if (error || !data) {
    console.error("GET /winner : error", error);
    return new Response("Failed to fetch users", {
      status: 500,
    });
  }

  const accountManagerAccount = privateKeyToAccount(process.env.LENS_ACCOUNT_MANAGER_PRIVATE_KEY! as `0x${string}`);
  console.log("GET /winner: accountManagerAccount", accountManagerAccount.address);

  const eligibleAccounts = data.map(row => row.account as `0x${string}`);

  let currentWinner: `0x${string}` | undefined;
  try {
    currentWinner = await walletClient.readContract({
      address: fameishAddress,
      abi: fameishAbi,
      functionName: "winner",
    });
    console.log("GET /winner: current winner", currentWinner);
  } catch {
    // there may not be a winner set yet
  }

  if (currentWinner && currentWinner !== ZeroAddress) {
    const accountsForUnfollow = data.filter(row => row.should_unfollow).map(row => row.account as `0x${string}`);
    console.log("GET /winner : ", accountsForUnfollow.length, "accounts for unfollow");

    for (let i = 0; i < accountsForUnfollow.length; i++) {
      const account = accountsForUnfollow[i];
      console.log("GET /winner : unfollowing winner with account", account);

      try {
        const unfollowWinnerData = encodeFunctionData({
          abi: graphAbi,
          functionName: "unfollow",
          args: [account, currentWinner, [], []],
        });
        const graphContractAddress = getContract("LensGlobalGraph").address;
        const { request: unfollow } = await walletClient.simulateContract({
          address: account,
          abi: accountAbi,
          functionName: "executeTransaction",
          args: [graphContractAddress, 0n, unfollowWinnerData],
        });
        const unfollowTx = await walletClient.writeContract(unfollow);
        console.log("GET /winner: unfollow", account, unfollowTx);
        await walletClient.waitForTransactionReceipt({ hash: unfollowTx });
      } catch {
        // console.error("GET /winner : error", e);
      }

      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    }

    console.log("GET /winner: bulk unfollowed for", accountsForUnfollow.length, "accounts");
  }

  // convert data array to CSV
  const csvRows = eligibleAccounts.join(",");
  const file = new File([csvRows], "data.csv", { type: "text/csv" });

  const storageClient = StorageClient.create();
  const acl = immutable(config.lens.chain.id);
  const uploadRes = await storageClient.uploadFile(file, { acl });
  const fileUri = uploadRes.uri;

  if (!fileUri) {
    console.error("GET /winner : uploadRes", uploadRes);
    return new Response("Failed to upload file", {
      status: 500,
    });
  }
  console.log("GET /winner: created entrants file", fileUri);

  const { request: selectRandom } = await walletClient.simulateContract({
    address: fameishAddress,
    abi: fameishAbi,
    functionName: "selectRandom",
    args: [BigInt(eligibleAccounts.length), fileUri],
  });
  const selectRandomTx = await walletClient.writeContract(selectRandom);
  console.log("GET /winner: new random selected", selectRandomTx);
  await walletClient.waitForTransactionReceipt({ hash: selectRandomTx });

  const followerIndex = await walletClient.readContract({
    address: fameishAddress,
    abi: fameishAbi,
    functionName: "followerIndex",
  });
  console.log("GET /winner: new followerIndex", followerIndex);

  const winnerAccount = eligibleAccounts[Number(followerIndex)];
  console.log("GET /winner: new winner selected", winnerAccount);

  const { request: setWinner } = await walletClient.simulateContract({
    address: fameishAddress,
    abi: fameishAbi,
    functionName: "setWinner",
    args: [winnerAccount],
  });
  const setWinnerTx = await walletClient.writeContract(setWinner);
  console.log("GET /winner: new winner set", setWinnerTx);
  await walletClient.waitForTransactionReceipt({ hash: setWinnerTx });

  let notFollowing: EvmAddress[] = [];
  for (let i = 0; i < eligibleAccounts.length; i += 50) {
    const batch = eligibleAccounts.slice(i, i + 50);

    const res = await fetchFollowStatus(lensClient, {
      pairs: batch.map(account => ({
        account: winnerAccount,
        follower: account,
      })),
    });

    if (res.isOk()) {
      const newFollowers = res.value
        .filter(followStatus => !followStatus.isFollowing.onChain && !followStatus.isFollowing.optimistic)
        .map(followStatus => followStatus.follower);
      notFollowing = [...notFollowing, ...newFollowers];
    }

    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
  }

  const { error: updateError } = await supabase
    .from("user")
    .update({ should_unfollow: true } satisfies TablesUpdate<"user">)
    .in("account", notFollowing);

  if (updateError) {
    console.error("GET /winner : error", updateError);
    return new Response("Failed to update users", {
      status: 500,
    });
  }

  console.log("GET /winner : following winner with", notFollowing.length, "accounts...");

  for (let i = 0; i < notFollowing.length; i += 50) {
    const batch = notFollowing.slice(i, i + 50);
    console.log("GET /winner : following winner with batch of", batch.length);

    try {
      const { request: bulkFollow } = await walletClient.simulateContract({
        address: fameishAddress,
        abi: fameishAbi,
        functionName: "bulkFollow",
        args: [batch],
      });
      const bulkFollowTx = await walletClient.writeContract(bulkFollow);
      console.log("GET /winner: bulk follow", i, "-", i + 50, bulkFollowTx);
      await walletClient.waitForTransactionReceipt({ hash: bulkFollowTx });
    } catch (e) {
      console.error("GET /winner : error", e);
    }

    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
  }

  return Response.json({ success: true });
}
