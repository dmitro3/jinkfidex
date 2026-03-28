/**
 * verify-dex.ts — Verify the full DEX stack deployed by deploy-dex.ts.
 *
 * Usage:
 *   npx hardhat run scripts/verify-dex.ts --network sepolia
 *   npx hardhat run scripts/verify-dex.ts --network base
 *
 * Reads addresses from deployments/dex-<chainId>.json
 *
 * NOTE: V2/V3 contracts are deployed from pre-built npm artifacts. Etherscan
 * often auto-detects these bytecodes as matching known Uniswap contracts and
 * marks them verified automatically. This script attempts programmatic
 * verification as a supplement; "Already Verified" responses are expected.
 */

import { run, network, ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const ZERO = ethers.ZeroAddress;
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

const V2_PAIR_INIT_CODE_HASH =
  "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";
const V3_POOL_INIT_CODE_HASH =
  "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";

// ── Verify helper ─────────────────────────────────────────────────────────────

async function verify(
  label: string,
  address: string,
  constructorArgs: unknown[],
  options?: { libraries?: Record<string, string> }
) {
  process.stdout.write(`  Verifying ${label.padEnd(30)} ${address}  …`);
  try {
    await run("verify:verify", {
      address,
      constructorArguments: constructorArgs,
      ...(options?.libraries ? { libraries: options.libraries } : {}),
    });
    console.log("  ✓");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes("already verified")) {
      console.log("  ✓  (already verified)");
    } else if (msg.includes("Contract source code already verified")) {
      console.log("  ✓  (already verified)");
    } else if (msg.includes("does not exist in the project")) {
      // Deployed from a pre-built npm artifact; source not in Hardhat build-info.
      console.log(`  ⚠  Skipped — source not in Hardhat build-info (npm artifact)`);
    } else if (msg.includes("compiled with solidity 0.7.6")) {
      // NFTDescriptor / NonfungibleTokenPositionDescriptor ship without
      // .sol source in the npm package — can't verify via Hardhat.
      // These are internal library contracts; NonfungiblePositionManager
      // (the user-facing one) IS verified.
      console.log(`  ⚠  Skipped — compiled with 0.7.6, source not in npm package`);
    } else {
      console.log(`  ✗  ${msg.split("\n")[0]}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const file    = path.join(__dirname, "..", "deployments", `dex-${chainId}.json`);

  if (!fs.existsSync(file)) {
    throw new Error(`No DEX deployment file at ${file}. Run deploy:dex first.`);
  }

  const record = JSON.parse(fs.readFileSync(file, "utf8"));
  const c = record.contracts as Record<string, string>;

  console.log(`\n${"═".repeat(72)}`);
  console.log(`  JinkFi DEX — Contract Verification`);
  console.log(`${"═".repeat(72)}`);
  console.log(`  Network:  ${network.name}  (chainId ${chainId})`);
  console.log(`  Source:   ${file}`);
  console.log(`${"═".repeat(72)}\n`);

  const deployer = record.deployer as string;
  const weth9    = c.weth9;

  // 1. V2 Factory — constructor: feeToSetter = deployer
  await verify("UniswapV2Factory", c.v2Factory, [deployer]);

  // 2. V2 Router02 — constructor: factory, weth9
  await verify("UniswapV2Router02", c.v2Router, [c.v2Factory, weth9]);

  // 3. V3 Factory — no constructor args
  await verify("UniswapV3Factory", c.v3Factory, []);

  // 4. NFTDescriptor library — no constructor args
  await verify("NFTDescriptor", c.nftDescriptor, []);

  // 5. NonfungibleTokenPositionDescriptor — constructor: weth9, nativeCurrencyLabel
  //    Also requires the NFTDescriptor library to be linked.
  const nativeCurrencyLabel = ethers.encodeBytes32String("ETH");
  await verify(
    "NonfungibleTokenPositionDesc",
    c.nftPositionDescriptor,
    [weth9, nativeCurrencyLabel],
    {
      libraries: {
        "contracts/libraries/NFTDescriptor.sol:NFTDescriptor": c.nftDescriptor,
        NFTDescriptor: c.nftDescriptor,
      },
    }
  );

  // 6. NonfungiblePositionManager — constructor: factory, weth9, tokenDescriptor
  await verify("NonfungiblePositionManager", c.nonfungiblePositionManager, [
    c.v3Factory,
    weth9,
    c.nftPositionDescriptor,
  ]);

  // 7. V3 SwapRouter — constructor: factory, weth9
  await verify("SwapRouter (V3)", c.v3SwapRouter, [c.v3Factory, weth9]);

  // 8. QuoterV2 — constructor: factory, weth9
  await verify("QuoterV2", c.quoterV2, [c.v3Factory, weth9]);

  // 9. TickLens — no constructor args
  await verify("TickLens", c.tickLens, []);

  // 10. UniversalRouter — constructor: RouterParameters struct
  const urParams = {
    permit2:                     PERMIT2,
    weth9:                       weth9,
    seaportV1_5:                ZERO,
    seaportV1_4:                ZERO,
    openseaConduit:              ZERO,
    nftxZap:                     ZERO,
    x2y2:                        ZERO,
    foundation:                  ZERO,
    sudoswap:                    ZERO,
    elementMarket:               ZERO,
    nft20Zap:                    ZERO,
    cryptopunks:                 ZERO,
    looksRareV2:                ZERO,
    routerRewardsDistributor:   ZERO,
    looksRareRewardsDistributor: ZERO,
    looksRareToken:              ZERO,
    v2Factory:                   c.v2Factory,
    v3Factory:                   c.v3Factory,
    pairInitCodeHash:            V2_PAIR_INIT_CODE_HASH,
    poolInitCodeHash:            V3_POOL_INIT_CODE_HASH,
  };
  await verify("UniversalRouter", c.universalRouter, [urParams]);

  console.log(`\n${"═".repeat(72)}`);
  console.log("  Verification run complete.");
  console.log(
    "  Tip: contracts marked ⚠ were deployed from npm artifacts.\n" +
    "  Etherscan often auto-verifies these via bytecode matching.\n" +
    "  Check each address on Etherscan to confirm."
  );
  console.log(`${"═".repeat(72)}\n`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
