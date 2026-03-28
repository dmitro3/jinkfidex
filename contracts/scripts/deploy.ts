/**
 * deploy.ts — Deploy TokenLocker (×2), JinkFarm, and optionally MockERC20.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network base
 *   npx hardhat run scripts/deploy.ts --network monad
 *   npx hardhat run scripts/deploy.ts --network localhost   (uses MockERC20)
 *
 * After a successful run this script:
 *   1. Prints all deployed addresses.
 *   2. Writes them to deployments/<chainId>.json for reference.
 *   3. Reminds you to paste the addresses into client/src/lib/contracts.ts.
 */

import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

// ── Constants ─────────────────────────────────────────────────────────────────

const FEE_RECIPIENT   = process.env.FEE_RECIPIENT_ADDRESS ?? "";
const LOCK_FEE_WEI    = BigInt(process.env.LOCK_FEE_WEI     ?? "0");
const REWARD_TOKEN    = process.env.REWARD_TOKEN_ADDRESS   ?? "";
const REWARD_PER_SEC  = BigInt(process.env.REWARD_PER_SECOND        ?? "1000000000000000000");
const FARM_DURATION   = parseInt(process.env.FARM_DURATION_SECONDS  ?? "7776000", 10);

const LOCAL_NETWORKS = new Set(["hardhat", "localhost"]);

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();
  const chainId    = (await ethers.provider.getNetwork()).chainId;
  const isLocal    = LOCAL_NETWORKS.has(network.name);

  console.log(`\n=== JinkFi Deployment ===`);
  console.log(`Network:   ${network.name} (chainId ${chainId})`);
  console.log(`Deployer:  ${deployer.address}`);
  console.log(`Balance:   ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ── 1. Resolve fee recipient ───────────────────────────────────────────────

  const feeRecipient = isLocal
    ? deployer.address
    : (FEE_RECIPIENT || deployer.address);

  console.log(`Fee recipient: ${feeRecipient}`);
  console.log(`Lock fee:      ${ethers.formatEther(LOCK_FEE_WEI)} ETH\n`);

  // ── 2. Resolve reward token (deploy MockERC20 on local/testnet) ───────────

  let rewardTokenAddress = REWARD_TOKEN;

  if (!rewardTokenAddress || isLocal) {
    console.log("Deploying MockERC20 as reward token…");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mock = await MockERC20.deploy(
      "Jink Token",
      "JINK",
      18,
      ethers.parseEther("100000000"), // 100M initial supply to deployer
    );
    await mock.waitForDeployment();
    rewardTokenAddress = await mock.getAddress();
    console.log(`  MockERC20 (JINK): ${rewardTokenAddress}`);
  } else {
    console.log(`Reward token:  ${rewardTokenAddress}`);
  }

  // ── 3. Deploy Util library (required by TokenLockerManagerV1 + TokenLockerV1) ─

  console.log("\nDeploying Util library…");
  const UtilFactory = await ethers.getContractFactory("Util");
  const utilLib = await UtilFactory.deploy();
  await utilLib.waitForDeployment();
  const utilLibAddr = await utilLib.getAddress();
  console.log(`  Util: ${utilLibAddr}`);

  // ── 4. Deploy TokenLockerManagerV1 (handles both token & LP locks) ────────

  console.log("\nDeploying TokenLockerManagerV1…");
  const LockerManager = await ethers.getContractFactory("TokenLockerManagerV1", {
    libraries: { Util: utilLibAddr },
  });
  const lockerManager = await LockerManager.deploy();
  await lockerManager.waitForDeployment();
  const lockerManagerAddr = await lockerManager.getAddress();
  console.log(`  TokenLockerManagerV1: ${lockerManagerAddr}`);

  // Set fee wallet to configured recipient (constructor defaults to deployer)
  if (feeRecipient !== deployer.address) {
    await (lockerManager as any).setFeeWallet(feeRecipient);
    console.log(`  Fee wallet set to: ${feeRecipient}`);
  }

  // ── 5. Deploy JinkFarm ────────────────────────────────────────────────────

  const startTime = Math.floor(Date.now() / 1000) + 60; // starts in 1 min
  console.log(`\nDeploying JinkFarm…`);
  const JinkFarm = await ethers.getContractFactory("JinkFarm");
  const farm = await JinkFarm.deploy(
    rewardTokenAddress,
    REWARD_PER_SEC,
    startTime,
    FARM_DURATION,
  );
  await farm.waitForDeployment();
  const farmAddr = await farm.getAddress();
  console.log(`  JinkFarm: ${farmAddr}`);

  // ── 6. Save deployment record ─────────────────────────────────────────────

  const record = {
    network:      network.name,
    chainId:      chainId.toString(),
    timestamp:    new Date().toISOString(),
    deployer:     deployer.address,
    feeRecipient,
    contracts: {
      rewardToken:   rewardTokenAddress,
      lockerManager: lockerManagerAddr,
      farm:          farmAddr,
    },
  };

  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${chainId}.json`);
  fs.writeFileSync(file, JSON.stringify(record, null, 2));
  console.log(`\nDeployment saved to ${file}`);

  // ── 7. Print next steps ───────────────────────────────────────────────────

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    DEPLOYMENT COMPLETE                       ║
╠══════════════════════════════════════════════════════════════╣
║  Chain:       ${network.name.padEnd(46)}║
║  ChainId:     ${chainId.toString().padEnd(46)}║
╠══════════════════════════════════════════════════════════════╣
║  LockerMgr:   ${lockerManagerAddr.padEnd(46)}║
║  JinkFarm:    ${farmAddr.padEnd(46)}║
║  RewardToken: ${rewardTokenAddress.padEnd(46)}║
╠══════════════════════════════════════════════════════════════╣
║  NEXT STEPS:                                                 ║
║  1. Verify:  npm run verify:${network.name.padEnd(33)}║
║  2. Update client/src/lib/contracts.ts with addresses above  ║
║  3. Fund farm: farm.fund(<amount>) after approving reward tok ║
║  4. Add pools: farm.addPool(100, <lpToken>, false)           ║
╚══════════════════════════════════════════════════════════════╝
`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
