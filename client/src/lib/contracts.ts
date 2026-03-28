export const ERC20_ABI = [
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

export const ROUTER_ABI = [
  { inputs: [{ name: "amountIn", type: "uint256" }, { name: "path", type: "address[]" }], name: "getAmountsOut", outputs: [{ name: "amounts", type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "amountOut", type: "uint256" }, { name: "path", type: "address[]" }], name: "getAmountsIn", outputs: [{ name: "amounts", type: "uint256[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "amountOutMin", type: "uint256" }, { name: "path", type: "address[]" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }], name: "swapExactETHForTokens", outputs: [{ name: "amounts", type: "uint256[]" }], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "amountIn", type: "uint256" }, { name: "amountOutMin", type: "uint256" }, { name: "path", type: "address[]" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }], name: "swapExactTokensForETH", outputs: [{ name: "amounts", type: "uint256[]" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "amountIn", type: "uint256" }, { name: "amountOutMin", type: "uint256" }, { name: "path", type: "address[]" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }], name: "swapExactTokensForTokens", outputs: [{ name: "amounts", type: "uint256[]" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "tokenA", type: "address" }, { name: "tokenB", type: "address" }, { name: "amountADesired", type: "uint256" }, { name: "amountBDesired", type: "uint256" }, { name: "amountAMin", type: "uint256" }, { name: "amountBMin", type: "uint256" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }], name: "addLiquidity", outputs: [{ name: "amountA", type: "uint256" }, { name: "amountB", type: "uint256" }, { name: "liquidity", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "token", type: "address" }, { name: "amountTokenDesired", type: "uint256" }, { name: "amountTokenMin", type: "uint256" }, { name: "amountETHMin", type: "uint256" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }], name: "addLiquidityETH", outputs: [{ name: "amountToken", type: "uint256" }, { name: "amountETH", type: "uint256" }, { name: "liquidity", type: "uint256" }], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "tokenA", type: "address" }, { name: "tokenB", type: "address" }, { name: "liquidity", type: "uint256" }, { name: "amountAMin", type: "uint256" }, { name: "amountBMin", type: "uint256" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }], name: "removeLiquidity", outputs: [{ name: "amountA", type: "uint256" }, { name: "amountB", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "WETH", outputs: [{ type: "address" }], stateMutability: "pure", type: "function" },
] as const;

export const FACTORY_ABI = [
  { inputs: [{ name: "tokenA", type: "address" }, { name: "tokenB", type: "address" }], name: "getPair", outputs: [{ name: "pair", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "" , type: "uint256" }], name: "allPairs", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "allPairsLength", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

export const PAIR_ABI = [
  { inputs: [], name: "getReserves", outputs: [{ name: "reserve0", type: "uint112" }, { name: "reserve1", type: "uint112" }, { name: "blockTimestampLast", type: "uint32" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "token0", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "token1", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }], name: "approve", outputs: [{ type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

// ── TokenLockerManagerV1 — manages both token and LP locks ────────────────────
// unlockTime_ is a DURATION in seconds (added to block.timestamp on-chain)
export const TOKEN_LOCKER_MANAGER_ABI = [
  { inputs: [{ name: "tokenAddress_", type: "address" }, { name: "amount_", type: "uint256" }, { name: "unlockTime_", type: "uint40" }], name: "createTokenLocker", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "lpAddress_", type: "address" }, { name: "amount_", type: "uint256" }, { name: "unlockTime_", type: "uint40" }], name: "createLpLocker", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [], name: "tokenLockerCount", outputs: [{ type: "uint40" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "lpLockerCount", outputs: [{ type: "uint40" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "creationEnabled", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "TokenLockerFee", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "LpLockerFee", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "feeWallet", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "id_", type: "uint40" }], name: "getTokenLockAddress", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "id_", type: "uint40" }], name: "getLpLockAddress", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "id_", type: "uint40" }], name: "getTokenLockData", outputs: [{ name: "isLpToken", type: "bool" }, { name: "id", type: "uint40" }, { name: "contractAddress", type: "address" }, { name: "lockOwner", type: "address" }, { name: "token", type: "address" }, { name: "createdBy", type: "address" }, { name: "createdAt", type: "uint40" }, { name: "blockTime", type: "uint40" }, { name: "unlockTime", type: "uint40" }, { name: "balance", type: "uint256" }, { name: "totalSupply", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "id_", type: "uint40" }], name: "getLpLockData", outputs: [{ name: "isLpToken", type: "bool" }, { name: "id", type: "uint40" }, { name: "contractAddress", type: "address" }, { name: "lockOwner", type: "address" }, { name: "token", type: "address" }, { name: "createdBy", type: "address" }, { name: "createdAt", type: "uint40" }, { name: "blockTime", type: "uint40" }, { name: "unlockTime", type: "uint40" }, { name: "balance", type: "uint256" }, { name: "totalSupply", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "id_", type: "uint40" }], name: "getLpData", outputs: [{ name: "hasLpData", type: "bool" }, { name: "id", type: "uint40" }, { name: "token0", type: "address" }, { name: "token1", type: "address" }, { name: "balance0", type: "uint256" }, { name: "balance1", type: "uint256" }, { name: "price0", type: "uint256" }, { name: "price1", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "address_", type: "address" }], name: "getTokenLockersForAddress", outputs: [{ type: "uint40[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "address_", type: "address" }], name: "getLpLockersForAddress", outputs: [{ type: "uint40[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_amount", type: "uint256" }], name: "setTokenLockerFee", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_amount", type: "uint256" }], name: "setLpLockerFee", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_newWallet", type: "address" }], name: "setFeeWallet", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "value_", type: "bool" }], name: "setCreationEnabled", outputs: [], stateMutability: "nonpayable", type: "function" },
] as const;

// ── TokenLockerV1 — individual locker contract (one per lock) ─────────────────
export const TOKEN_LOCKER_V1_ABI = [
  { inputs: [{ name: "amount_", type: "uint256" }, { name: "newUnlockTime_", type: "uint40" }], name: "deposit", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "address_", type: "address" }], name: "withdrawToken", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "withdrawEth", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "newOwner_", type: "address" }], name: "transferOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "getLockData", outputs: [{ name: "isLpToken", type: "bool" }, { name: "id", type: "uint40" }, { name: "contractAddress", type: "address" }, { name: "lockOwner", type: "address" }, { name: "token", type: "address" }, { name: "createdBy", type: "address" }, { name: "createdAt", type: "uint40" }, { name: "blockTime", type: "uint40" }, { name: "unlockTime", type: "uint40" }, { name: "balance", type: "uint256" }, { name: "totalSupply", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
] as const;

// Keep old name as alias for any existing code that references it
export const TOKEN_LOCKER_ABI = TOKEN_LOCKER_MANAGER_ABI;
export const LP_LOCKER_ABI = TOKEN_LOCKER_MANAGER_ABI;

export const FARM_ABI = [
  { inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingReward", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "_pid", type: "uint256" }, { name: "_amount", type: "uint256" }], name: "deposit", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_pid", type: "uint256" }, { name: "_amount", type: "uint256" }], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_pid", type: "uint256" }], name: "harvest", outputs: [], stateMutability: "nonpayable", type: "function" },
] as const;

export const CONTRACT_ADDRESSES: Record<number, {
  router: `0x${string}`;
  factory: `0x${string}`;
  lockerManager: `0x${string}`;
  farm: `0x${string}`;
  // V3 + Universal Router (populated where deployed)
  v3Factory?: `0x${string}`;
  nonfungiblePositionManager?: `0x${string}`;
  v3SwapRouter?: `0x${string}`;
  universalRouter?: `0x${string}`;
  quoterV2?: `0x${string}`;
}> = {
  1: { // Ethereum Mainnet
    router:        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    factory:       "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    lockerManager: "0x0000000000000000000000000000000000000001",
    farm:          "0x0000000000000000000000000000000000000002",
  },
  11155111: { // Sepolia — JinkFi deployment 2026-03-27
    router:                     "0x01faa5159FC0d9103efC0E8274fBD36D4f2e12DE",
    factory:                    "0x4Ad76DCe86BecEBC48Aba2f4dD0F685D6C3B7430",
    lockerManager:              "0x9EE61392636ab192537DE1D6541056bc2aDFCF8F",
    farm:                       "0x7Be64D4d66a2e24D83A8BA373ff8478220b9DA09",
    v3Factory:                  "0xD156649d5B844d9a72cF157c645c9aB0E016ccaf",
    nonfungiblePositionManager: "0x582787a17A0cf0fdbf893771739E8C150446692e",
    v3SwapRouter:               "0x0e2B6BE041806391534B18AD2AE1548d8AA088C4",
    universalRouter:            "0xA1E608E29016430a486A88a2Da719DDdBdA054bC",
    quoterV2:                   "0xa4E0c4Fc04B3786bE5687B70Be9c5abEEae2d51f",
  },
  8453: { // Base
    router:        "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
    factory:       "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
    lockerManager: "0x0000000000000000000000000000000000000001",
    farm:          "0x0000000000000000000000000000000000000002",
  },
};
