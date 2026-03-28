// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenLocker
 * @notice Trustless ERC-20 time-lock contract.  Deploy once for regular tokens
 *         and once again for LP tokens — the logic is identical.
 *
 *  Fee model: callers send a flat ETH fee (feeWei) alongside lockTokens().
 *  The fee is forwarded to feeRecipient immediately.  Set feeWei = 0 for free locks.
 */
contract TokenLocker is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ── Storage ───────────────────────────────────────────────────────────────

    struct Lock {
        address token;
        address owner;
        uint256 amount;
        uint256 unlockTime;
        bool    withdrawn;
    }

    mapping(uint256 => Lock)       public  locks;
    mapping(address => uint256[]) private  _ownerLocks;
    uint256                        public  lockCount;

    uint256 public feeWei;        // flat ETH fee per lock (0 = free)
    address public feeRecipient;  // receives the lock fee

    // ── Events ────────────────────────────────────────────────────────────────

    event Locked(
        uint256 indexed lockId,
        address indexed token,
        address indexed owner,
        uint256 amount,
        uint256 unlockTime
    );
    event Withdrawn(uint256 indexed lockId, address indexed owner);
    event LockExtended(uint256 indexed lockId, uint256 newUnlockTime);
    event LockOwnershipTransferred(uint256 indexed lockId, address indexed from, address indexed to);
    event FeeUpdated(uint256 newFeeWei);
    event FeeRecipientUpdated(address newRecipient);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address _feeRecipient, uint256 _feeWei) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
        feeWei       = _feeWei;
    }

    // ── User functions ────────────────────────────────────────────────────────

    /**
     * @notice Lock `amount` of `token` until `unlockTime`.
     * @dev    Caller must have approved this contract for at least `amount`.
     *         If feeWei > 0, caller must send exactly feeWei in msg.value.
     * @return lockId  Unique ID for this lock.
     */
    function lockTokens(
        address token,
        uint256 amount,
        uint256 unlockTime
    ) external payable nonReentrant returns (uint256 lockId) {
        require(amount > 0,                   "Amount must be > 0");
        require(unlockTime > block.timestamp, "Unlock time must be in future");
        require(msg.value >= feeWei,          "Insufficient lock fee");

        // Collect fee
        if (feeWei > 0 && feeRecipient != address(0)) {
            (bool ok, ) = feeRecipient.call{value: msg.value}("");
            require(ok, "Fee transfer failed");
        } else if (msg.value > 0) {
            // Refund overpayment when fee is zero
            (bool ok, ) = msg.sender.call{value: msg.value}("");
            require(ok, "Refund failed");
        }

        // Transfer tokens into escrow
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        lockId = lockCount++;
        locks[lockId] = Lock({
            token:      token,
            owner:      msg.sender,
            amount:     amount,
            unlockTime: unlockTime,
            withdrawn:  false
        });
        _ownerLocks[msg.sender].push(lockId);

        emit Locked(lockId, token, msg.sender, amount, unlockTime);
    }

    /**
     * @notice Withdraw tokens once the lock period has elapsed.
     */
    function withdraw(uint256 lockId) external nonReentrant {
        Lock storage lock = locks[lockId];
        require(lock.owner == msg.sender,           "Not lock owner");
        require(!lock.withdrawn,                    "Already withdrawn");
        require(block.timestamp >= lock.unlockTime, "Still locked");

        lock.withdrawn = true;
        IERC20(lock.token).safeTransfer(msg.sender, lock.amount);

        emit Withdrawn(lockId, msg.sender);
    }

    /**
     * @notice Extend the unlock time of an existing lock.
     *         Can only be pushed forward, never back.
     */
    function extendLock(uint256 lockId, uint256 newUnlockTime) external {
        Lock storage lock = locks[lockId];
        require(lock.owner == msg.sender,        "Not lock owner");
        require(!lock.withdrawn,                 "Already withdrawn");
        require(newUnlockTime > lock.unlockTime, "Cannot reduce lock time");

        lock.unlockTime = newUnlockTime;
        emit LockExtended(lockId, newUnlockTime);
    }

    /**
     * @notice Transfer ownership of a lock to another address.
     */
    function transferLock(uint256 lockId, address newOwner) external {
        Lock storage lock = locks[lockId];
        require(lock.owner == msg.sender, "Not lock owner");
        require(!lock.withdrawn,          "Already withdrawn");
        require(newOwner != address(0),   "Zero address");

        address prev  = lock.owner;
        lock.owner    = newOwner;
        _ownerLocks[newOwner].push(lockId);

        emit LockOwnershipTransferred(lockId, prev, newOwner);
    }

    // ── View functions ────────────────────────────────────────────────────────

    /// @notice Returns all lock IDs created by `owner`.
    function getLocksForOwner(address owner) external view returns (uint256[] memory) {
        return _ownerLocks[owner];
    }

    /// @notice Returns full details for a single lock.
    function getLock(uint256 lockId)
        external
        view
        returns (
            address token,
            address owner,
            uint256 amount,
            uint256 unlockTime,
            bool    withdrawn
        )
    {
        Lock storage l = locks[lockId];
        return (l.token, l.owner, l.amount, l.unlockTime, l.withdrawn);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setFee(uint256 _feeWei) external onlyOwner {
        feeWei = _feeWei;
        emit FeeUpdated(_feeWei);
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Zero address");
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(_recipient);
    }
}
