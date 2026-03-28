import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { TokenLocker, MockERC20 } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TokenLocker", () => {
  let locker:    TokenLocker;
  let token:     MockERC20;
  let owner:     HardhatEthersSigner;
  let alice:     HardhatEthersSigner;
  let bob:       HardhatEthersSigner;
  let feeWallet: HardhatEthersSigner;

  const FEE_WEI   = ethers.parseEther("0.01");
  const AMOUNT    = ethers.parseEther("1000");
  const ONE_WEEK  = 7 * 24 * 3600;

  beforeEach(async () => {
    [owner, alice, bob, feeWallet] = await ethers.getSigners();

    const MockERC20F = await ethers.getContractFactory("MockERC20");
    token = await MockERC20F.deploy("Test Token", "TST", 18, ethers.parseEther("1000000")) as unknown as MockERC20;

    const LockerF = await ethers.getContractFactory("TokenLocker");
    locker = await LockerF.deploy(feeWallet.address, FEE_WEI) as unknown as TokenLocker;

    // Fund alice
    await token.mint(alice.address, AMOUNT * 10n);
    await token.connect(alice).approve(await locker.getAddress(), ethers.MaxUint256);
  });

  // ── lockTokens ─────────────────────────────────────────────────────────────

  describe("lockTokens", () => {
    it("creates a lock and emits Locked", async () => {
      const unlockTime = (await time.latest()) + ONE_WEEK;
      await expect(
        locker.connect(alice).lockTokens(await token.getAddress(), AMOUNT, unlockTime, { value: FEE_WEI })
      )
        .to.emit(locker, "Locked")
        .withArgs(0, await token.getAddress(), alice.address, AMOUNT, unlockTime);

      const lock = await locker.getLock(0);
      expect(lock.token).to.equal(await token.getAddress());
      expect(lock.owner).to.equal(alice.address);
      expect(lock.amount).to.equal(AMOUNT);
      expect(lock.unlockTime).to.equal(unlockTime);
      expect(lock.withdrawn).to.be.false;
    });

    it("forwards fee to feeWallet", async () => {
      const unlockTime = (await time.latest()) + ONE_WEEK;
      const before = await ethers.provider.getBalance(feeWallet.address);
      await locker.connect(alice).lockTokens(await token.getAddress(), AMOUNT, unlockTime, { value: FEE_WEI });
      const after = await ethers.provider.getBalance(feeWallet.address);
      expect(after - before).to.equal(FEE_WEI);
    });

    it("rejects insufficient fee", async () => {
      const unlockTime = (await time.latest()) + ONE_WEEK;
      await expect(
        locker.connect(alice).lockTokens(await token.getAddress(), AMOUNT, unlockTime, { value: FEE_WEI - 1n })
      ).to.be.revertedWith("Insufficient lock fee");
    });

    it("rejects past unlock time", async () => {
      const unlockTime = (await time.latest()) - 1;
      await expect(
        locker.connect(alice).lockTokens(await token.getAddress(), AMOUNT, unlockTime, { value: FEE_WEI })
      ).to.be.revertedWith("Unlock time must be in future");
    });

    it("tracks locks by owner", async () => {
      const unlockTime = (await time.latest()) + ONE_WEEK;
      await locker.connect(alice).lockTokens(await token.getAddress(), AMOUNT, unlockTime, { value: FEE_WEI });
      await locker.connect(alice).lockTokens(await token.getAddress(), AMOUNT, unlockTime + 1, { value: FEE_WEI });
      const ids = await locker.getLocksForOwner(alice.address);
      expect(ids).to.deep.equal([0n, 1n]);
    });
  });

  // ── withdraw ───────────────────────────────────────────────────────────────

  describe("withdraw", () => {
    let lockId: bigint;
    let unlockTime: number;

    beforeEach(async () => {
      unlockTime = (await time.latest()) + ONE_WEEK;
      await locker.connect(alice).lockTokens(await token.getAddress(), AMOUNT, unlockTime, { value: FEE_WEI });
      lockId = 0n;
    });

    it("returns tokens after unlock", async () => {
      await time.increaseTo(unlockTime);
      const before = await token.balanceOf(alice.address);
      await locker.connect(alice).withdraw(lockId);
      const after = await token.balanceOf(alice.address);
      expect(after - before).to.equal(AMOUNT);
    });

    it("marks lock as withdrawn", async () => {
      await time.increaseTo(unlockTime);
      await locker.connect(alice).withdraw(lockId);
      const lock = await locker.getLock(lockId);
      expect(lock.withdrawn).to.be.true;
    });

    it("reverts before unlock", async () => {
      await expect(locker.connect(alice).withdraw(lockId)).to.be.revertedWith("Still locked");
    });

    it("reverts double-withdraw", async () => {
      await time.increaseTo(unlockTime);
      await locker.connect(alice).withdraw(lockId);
      await expect(locker.connect(alice).withdraw(lockId)).to.be.revertedWith("Already withdrawn");
    });

    it("reverts from non-owner", async () => {
      await time.increaseTo(unlockTime);
      await expect(locker.connect(bob).withdraw(lockId)).to.be.revertedWith("Not lock owner");
    });
  });

  // ── extendLock ─────────────────────────────────────────────────────────────

  describe("extendLock", () => {
    it("extends unlock time", async () => {
      const unlockTime  = (await time.latest()) + ONE_WEEK;
      const newUnlock   = unlockTime + ONE_WEEK;
      await locker.connect(alice).lockTokens(await token.getAddress(), AMOUNT, unlockTime, { value: FEE_WEI });
      await locker.connect(alice).extendLock(0n, newUnlock);
      expect((await locker.getLock(0n)).unlockTime).to.equal(newUnlock);
    });

    it("cannot reduce lock time", async () => {
      const unlockTime = (await time.latest()) + ONE_WEEK;
      await locker.connect(alice).lockTokens(await token.getAddress(), AMOUNT, unlockTime, { value: FEE_WEI });
      await expect(locker.connect(alice).extendLock(0n, unlockTime - 1)).to.be.revertedWith("Cannot reduce lock time");
    });
  });

  // ── transferLock ──────────────────────────────────────────────────────

  describe("transferLock", () => {
    it("transfers lock to new owner", async () => {
      const unlockTime = (await time.latest()) + ONE_WEEK;
      await locker.connect(alice).lockTokens(await token.getAddress(), AMOUNT, unlockTime, { value: FEE_WEI });
      await locker.connect(alice).transferLock(0n, bob.address);
      expect((await locker.getLock(0n)).owner).to.equal(bob.address);
    });

    it("new owner can withdraw", async () => {
      const unlockTime = (await time.latest()) + ONE_WEEK;
      await locker.connect(alice).lockTokens(await token.getAddress(), AMOUNT, unlockTime, { value: FEE_WEI });
      await locker.connect(alice).transferLock(0n, bob.address);
      await time.increaseTo(unlockTime);
      await expect(locker.connect(bob).withdraw(0n)).to.emit(locker, "Withdrawn");
    });
  });

  // ── admin ──────────────────────────────────────────────────────────────────

  describe("admin", () => {
    it("owner can update fee", async () => {
      const newFee = ethers.parseEther("0.05");
      await locker.connect(owner).setFee(newFee);
      expect(await locker.feeWei()).to.equal(newFee);
    });

    it("non-owner cannot update fee", async () => {
      await expect(locker.connect(alice).setFee(0n)).to.be.reverted;
    });
  });
});
