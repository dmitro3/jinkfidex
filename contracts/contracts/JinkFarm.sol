// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title JinkFarm
 * @notice MasterChef-style multi-pool yield farm and staking contract.
 *
 *  Rewards are distributed from a pre-funded balance at a fixed rate
 *  (rewardPerSecond), split across pools proportionally by allocPoint.
 *
 *  Used by both the /farm page (multi-pool LP farming) and the /staking
 *  page (single-asset staking, just add pool with the staking token as LP).
 *
 *  Admin workflow:
 *   1. Deploy with rewardToken, rewardPerSecond, startTime, and duration.
 *   2. Call fund() to deposit reward tokens into the contract.
 *   3. Call addPool() for each pool/staking vault to activate.
 *   4. Users then deposit(), withdraw(), harvest().
 */
contract JinkFarm is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ── Types ─────────────────────────────────────────────────────────────────

    struct PoolInfo {
        IERC20  lpToken;           // token users deposit (LP or single asset)
        uint256 allocPoint;        // weight relative to other pools
        uint256 lastRewardTime;    // last timestamp rewards were distributed
        uint256 accRewardPerShare; // accumulated rewards per token, scaled 1e12
        uint256 totalDeposited;    // total LP tokens deposited in this pool
    }

    struct UserInfo {
        uint256 amount;      // LP tokens deposited by this user
        uint256 rewardDebt;  // reward debt (MasterChef formula)
    }

    // ── Storage ───────────────────────────────────────────────────────────────

    IERC20  public rewardToken;
    uint256 public rewardPerSecond; // total rewards emitted per second
    uint256 public startTime;
    uint256 public endTime;
    uint256 public totalAllocPoint;

    PoolInfo[]                                  public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) private _userInfo;

    // ── Events ────────────────────────────────────────────────────────────────

    event PoolAdded(uint256 indexed pid, address indexed lpToken, uint256 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 reward);
    event Funded(uint256 amount, uint256 newEndTime);
    event RewardRateUpdated(uint256 newRate);

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _rewardToken      ERC-20 token paid out as farming rewards.
     * @param _rewardPerSecond  Tokens emitted across ALL pools per second (18-dec units).
     * @param _startTime        Unix timestamp when rewards start accruing.
     * @param _duration         How many seconds the initial fund covers.
     */
    constructor(
        address _rewardToken,
        uint256 _rewardPerSecond,
        uint256 _startTime,
        uint256 _duration
    ) Ownable(msg.sender) {
        require(_rewardToken != address(0), "Zero address");
        rewardToken      = IERC20(_rewardToken);
        rewardPerSecond  = _rewardPerSecond;
        startTime        = _startTime;
        endTime          = _startTime + _duration;
    }

    // ── Pool admin ────────────────────────────────────────────────────────────

    /**
     * @notice Add a new pool.  lpToken can be any ERC-20 (LP or single asset).
     *         withUpdate = true will synchronise all pools before the change.
     */
    function addPool(
        uint256 allocPoint,
        address lpToken,
        bool    withUpdate
    ) external onlyOwner {
        require(lpToken != address(0),                              "Zero address");
        require(lpToken != address(rewardToken),                    "Cannot stake reward token");
        if (withUpdate) massUpdatePools();

        uint256 lastReward = block.timestamp > startTime ? block.timestamp : startTime;
        totalAllocPoint   += allocPoint;
        poolInfo.push(PoolInfo({
            lpToken:           IERC20(lpToken),
            allocPoint:        allocPoint,
            lastRewardTime:    lastReward,
            accRewardPerShare: 0,
            totalDeposited:    0
        }));

        emit PoolAdded(poolInfo.length - 1, lpToken, allocPoint);
    }

    /// @notice Update allocation for an existing pool.
    function setPool(uint256 pid, uint256 allocPoint, bool withUpdate) external onlyOwner {
        if (withUpdate) massUpdatePools();
        else updatePool(pid);
        totalAllocPoint       = totalAllocPoint - poolInfo[pid].allocPoint + allocPoint;
        poolInfo[pid].allocPoint = allocPoint;
        emit PoolUpdated(pid, allocPoint);
    }

    // ── Reward funding ────────────────────────────────────────────────────────

    /**
     * @notice Deposit `amount` of rewardToken to extend the farming period.
     *         New endTime = current endTime + amount / rewardPerSecond.
     */
    function fund(uint256 amount) external onlyOwner {
        require(rewardPerSecond > 0, "Rate not set");
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        endTime += amount / rewardPerSecond;
        emit Funded(amount, endTime);
    }

    /// @notice Update the emission rate (will massUpdatePools first).
    function setRewardPerSecond(uint256 newRate) external onlyOwner {
        massUpdatePools();
        rewardPerSecond = newRate;
        emit RewardRateUpdated(newRate);
    }

    // ── Pool update ───────────────────────────────────────────────────────────

    function massUpdatePools() public {
        uint256 len = poolInfo.length;
        for (uint256 i = 0; i < len; i++) updatePool(i);
    }

    function updatePool(uint256 pid) public {
        PoolInfo storage pool = poolInfo[pid];
        if (block.timestamp <= pool.lastRewardTime) return;

        if (pool.totalDeposited == 0 || totalAllocPoint == 0 || pool.allocPoint == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }

        uint256 to = block.timestamp < endTime ? block.timestamp : endTime;
        if (to > pool.lastRewardTime) {
            uint256 elapsed = to - pool.lastRewardTime;
            uint256 reward  = elapsed * rewardPerSecond * pool.allocPoint / totalAllocPoint;
            pool.accRewardPerShare += reward * 1e12 / pool.totalDeposited;
        }
        pool.lastRewardTime = block.timestamp;
    }

    // ── View functions ────────────────────────────────────────────────────────

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /// @notice Returns the deposited amount and reward debt for a user in a pool.
    function userInfo(uint256 _pid, address _user)
        external view
        returns (uint256 amount, uint256 rewardDebt)
    {
        UserInfo storage u = _userInfo[_pid][_user];
        return (u.amount, u.rewardDebt);
    }

    /**
     * @notice Pending (unharvested) rewards for `_user` in pool `_pid`.
     *         Simulates an updatePool without writing state.
     */
    function pendingReward(uint256 _pid, address _user)
        external view
        returns (uint256)
    {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage u    = _userInfo[_pid][_user];

        uint256 acc = pool.accRewardPerShare;
        if (block.timestamp > pool.lastRewardTime && pool.totalDeposited > 0 && totalAllocPoint > 0) {
            uint256 to      = block.timestamp < endTime ? block.timestamp : endTime;
            if (to > pool.lastRewardTime) {
                uint256 elapsed = to - pool.lastRewardTime;
                uint256 reward  = elapsed * rewardPerSecond * pool.allocPoint / totalAllocPoint;
                acc += reward * 1e12 / pool.totalDeposited;
            }
        }

        return u.amount * acc / 1e12 - u.rewardDebt;
    }

    // ── User actions ──────────────────────────────────────────────────────────

    /**
     * @notice Deposit LP tokens into pool `_pid`.
     *         Pending rewards are harvested automatically on every deposit.
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage u    = _userInfo[_pid][msg.sender];

        updatePool(_pid);
        _harvest(_pid, msg.sender, u);

        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
            u.amount          += _amount;
            pool.totalDeposited += _amount;
        }

        u.rewardDebt = u.amount * pool.accRewardPerShare / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @notice Withdraw LP tokens from pool `_pid`.
     *         Pending rewards are harvested automatically.
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage u    = _userInfo[_pid][msg.sender];

        require(u.amount >= _amount, "Insufficient balance");

        updatePool(_pid);
        _harvest(_pid, msg.sender, u);

        if (_amount > 0) {
            u.amount          -= _amount;
            pool.totalDeposited -= _amount;
            pool.lpToken.safeTransfer(msg.sender, _amount);
        }

        u.rewardDebt = u.amount * pool.accRewardPerShare / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @notice Claim pending rewards from pool `_pid` without touching the deposit.
     */
    function harvest(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage u    = _userInfo[_pid][msg.sender];

        updatePool(_pid);
        _harvest(_pid, msg.sender, u);

        u.rewardDebt = u.amount * pool.accRewardPerShare / 1e12;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _harvest(uint256 _pid, address _to, UserInfo storage u) internal {
        PoolInfo storage pool = poolInfo[_pid];
        uint256 pending = u.amount * pool.accRewardPerShare / 1e12 - u.rewardDebt;
        if (pending > 0) {
            // Safe transfer — if farm runs out, send what's available
            uint256 bal = rewardToken.balanceOf(address(this));
            uint256 pay = pending > bal ? bal : pending;
            rewardToken.safeTransfer(_to, pay);
            emit Harvest(_to, _pid, pay);
        }
    }

    // ── Emergency (owner only) ────────────────────────────────────────────────

    /**
     * @notice Rescue any ERC-20 mistakenly sent here.
     *         Cannot rescue LP tokens that users have deposited.
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        // Prevent draining active pool deposits
        uint256 len = poolInfo.length;
        for (uint256 i = 0; i < len; i++) {
            require(address(poolInfo[i].lpToken) != token, "Cannot rescue active LP");
        }
        IERC20(token).safeTransfer(owner(), amount);
    }
}
