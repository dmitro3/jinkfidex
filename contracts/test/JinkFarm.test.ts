import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { JinkFarm, MockERC20 } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("JinkFarm", () => {
  let farm:      JinkFarm;
  let reward:    MockERC20;
  let lpToken:   MockERC20;
  let owner:     HardhatEthersSigner;
  let alice:     HardhatEthersSigner;
  let bob:       HardhatEthersSigner;

  const PER_SEC    = ethers.parseEther("1");    // 1 REWARD / sec
  const DURATION   = 90 * 24 * 3600;           // 90 days
  const FUND_AMOUNT = PER_SEC * BigInt(DURATION);

  async function deploy(startDelay = 0) {
    [owner, alice, bob] = await ethers.getSigners();

    const MockERC20F = await ethers.getContractFactory("MockERC20");
    reward  = await MockERC20F.deploy("Reward", "REW", 18, FUND_AMOUNT * 2n) as unknown as MockERC20;
    lpToken = await MockERC20F.deploy("LP Token", "LPT", 18, ethers.parseEther("1000000")) as unknown as MockERC20;

    const startTime = (await time.latest()) + 1 + startDelay;
    const FarmF     = await ethers.getContractFactory("JinkFarm");
    farm = await FarmF.deploy(
      await reward.getAddress(),
      PER_SEC,
      startTime,
      DURATION,
    ) as unknown as JinkFarm;

    // Approve and fund farm
    await reward.approve(await farm.getAddress(), ethers.MaxUint256);
    await farm.connect(owner).fund(FUND_AMOUNT);

    // Add pool
    await farm.connect(owner).addPool(100, await lpToken.getAddress(), false);

    // Give LP tokens to users
    await lpToken.mint(alice.address, ethers.parseEther("10000"));
    await lpToken.mint(bob.address,   ethers.parseEther("10000"));
    await lpToken.connect(alice).approve(await farm.getAddress(), ethers.MaxUint256);
    await lpToken.connect(bob).approve(await farm.getAddress(),   ethers.MaxUint256);
  }

  beforeEach(() => deploy());

  // ── setup ──────────────────────────────────────────────────────────────────

  it("initialises correctly", async () => {
    expect(await farm.rewardPerSecond()).to.equal(PER_SEC);
    expect(await farm.poolLength()).to.equal(1);
  });

  // ── deposit ────────────────────────────────────────────────────────────────

  describe("deposit", () => {
    it("increases user balance", async () => {
      const amt = ethers.parseEther("100");
      await farm.connect(alice).deposit(0, amt);
      const [amount] = await farm.userInfo(0, alice.address);
      expect(amount).to.equal(amt);
    });

    it("emits Deposit", async () => {
      await expect(farm.connect(alice).deposit(0, ethers.parseEther("100")))
        .to.emit(farm, "Deposit")
        .withArgs(alice.address, 0, ethers.parseEther("100"));
    });
  });

  // ── pendingReward ──────────────────────────────────────────────────────────

  describe("pendingReward", () => {
    it("accrues over time", async () => {
      const amt = ethers.parseEther("100");
      await farm.connect(alice).deposit(0, amt);

      await time.increase(100); // advance 100 seconds

      const pending = await farm.pendingReward(0, alice.address);
      // ~100 tokens ± rounding
      expect(pending).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("2"));
    });

    it("splits proportionally between users", async () => {
      const amt = ethers.parseEther("100");
      await farm.connect(alice).deposit(0, amt);
      await farm.connect(bob).deposit(0, amt);

      await time.increase(200);

      const alicePending = await farm.pendingReward(0, alice.address);
      const bobPending   = await farm.pendingReward(0, bob.address);

      // Each gets ~50% of 200 seconds = ~100 tokens
      expect(alicePending).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("5"));
      expect(bobPending).to.be.closeTo(ethers.parseEther("100"),   ethers.parseEther("5"));
    });
  });

  // ── harvest ────────────────────────────────────────────────────────────────

  describe("harvest", () => {
    it("transfers pending reward to user", async () => {
      await farm.connect(alice).deposit(0, ethers.parseEther("100"));
      await time.increase(100);

      const before = await reward.balanceOf(alice.address);
      await farm.connect(alice).harvest(0);
      const after  = await reward.balanceOf(alice.address);

      expect(after - before).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("2"));
    });

    it("resets pending after harvest", async () => {
      await farm.connect(alice).deposit(0, ethers.parseEther("100"));
      await time.increase(100);
      await farm.connect(alice).harvest(0);

      // Immediately after harvest pending should be near zero
      const pending = await farm.pendingReward(0, alice.address);
      expect(pending).to.be.lt(ethers.parseEther("1"));
    });
  });

  // ── withdraw ───────────────────────────────────────────────────────────────

  describe("withdraw", () => {
    it("returns LP tokens and harvests reward", async () => {
      const amt = ethers.parseEther("100");
      await farm.connect(alice).deposit(0, amt);
      await time.increase(50);

      const lpBefore  = await lpToken.balanceOf(alice.address);
      const rewBefore = await reward.balanceOf(alice.address);
      await farm.connect(alice).withdraw(0, amt);
      const lpAfter   = await lpToken.balanceOf(alice.address);
      const rewAfter  = await reward.balanceOf(alice.address);

      expect(lpAfter - lpBefore).to.equal(amt);
      expect(rewAfter - rewBefore).to.be.closeTo(ethers.parseEther("50"), ethers.parseEther("2"));
    });

    it("reverts if balance insufficient", async () => {
      const amt = ethers.parseEther("100");
      await farm.connect(alice).deposit(0, amt);
      await expect(farm.connect(alice).withdraw(0, amt + 1n)).to.be.revertedWith("Insufficient balance");
    });
  });

  // ── admin ──────────────────────────────────────────────────────────────────

  describe("admin", () => {
    it("owner can add pool", async () => {
      const AnotherLP = await ethers.getContractFactory("MockERC20");
      const another   = await AnotherLP.deploy("LP2", "LP2", 18, 0n);
      await farm.connect(owner).addPool(50, await another.getAddress(), false);
      expect(await farm.poolLength()).to.equal(2);
    });

    it("only owner can add pool", async () => {
      await expect(
        farm.connect(alice).addPool(50, await lpToken.getAddress(), false)
      ).to.be.reverted;
    });

    it("rescueTokens prevents draining active LP", async () => {
      await expect(
        farm.connect(owner).rescueTokens(await lpToken.getAddress(), 1n)
      ).to.be.revertedWith("Cannot rescue active LP");
    });
  });
});
