/**
 * verify.ts — Verify deployed contracts on Etherscan / Basescan / etc.
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network base
 *
 * Reads the deployment record from deployments/<chainId>.json
 */

import { run, network, ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

async function verify(address: string, constructorArgs: unknown[]) {
  console.log(`\nVerifying ${address}…`);
  try {
    await run("verify:verify", {
      address,
      constructorArguments: constructorArgs,
    });
    console.log(`  ✓ Verified`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Already Verified") || msg.includes("already verified")) {
      console.log("  ✓ Already verified");
    } else {
      console.error(`  ✗ Error: ${msg}`);
    }
  }
}

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const file    = path.join(__dirname, "..", "deployments", `${chainId}.json`);

  if (!fs.existsSync(file)) {
    throw new Error(`No deployment file found at ${file}. Deploy first.`);
  }

  const record = JSON.parse(fs.readFileSync(file, "utf8"));
  const { contracts } = record;

  const REWARD_PER_SEC = BigInt(process.env.REWARD_PER_SECOND ?? "1000000000000000000");
  const FARM_DURATION  = parseInt(process.env.FARM_DURATION_SECONDS ?? "7776000", 10);

  console.log(`\n=== Verifying on ${network.name} (chainId ${chainId}) ===`);
  console.log(`Reading deployment from ${file}\n`);

  // TokenLockerManagerV1 — no constructor args
  await verify(contracts.lockerManager, []);

  // JinkFarm — need original startTime from deployment record
  // Hardhat verification requires exact constructor args at deploy time.
  // Re-run deploy with same args or supply them manually here.
  const startTime = Math.floor(new Date(record.timestamp).getTime() / 1000) + 60;
  await verify(contracts.farm, [
    contracts.rewardToken,
    REWARD_PER_SEC,
    startTime,
    FARM_DURATION,
  ]);

  // MockERC20 (testnet only)
  if (contracts.rewardToken && network.name === "localhost") {
    await verify(contracts.rewardToken, [
      "Jink Token", "JINK", 18,
      ethers.parseEther("100000000"),
    ]);
  }

  console.log("\n✓ Verification complete.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
