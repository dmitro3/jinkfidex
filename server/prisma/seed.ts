import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database…");

  // ── Pools ──────────────────────────────────────────────────────────────────
  const pools = [
    { address: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc", chainId: 1, token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", token1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", token0Symbol: "ETH",  token1Symbol: "USDC", feeTier: "0.3%",  reserve0: "12450.82",  reserve1: "44132450.00", tvlUSD: 88_264_900, volume24h: 6_420_000, apr: 18.42 },
    { address: "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852", chainId: 1, token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", token1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", token0Symbol: "ETH",  token1Symbol: "USDT", feeTier: "0.3%",  reserve0: "9821.44",   reserve1: "34801200.00", tvlUSD: 69_602_400, volume24h: 4_810_000, apr: 14.87 },
    { address: "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940", chainId: 1, token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", token1: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", token0Symbol: "ETH",  token1Symbol: "WBTC", feeTier: "0.3%",  reserve0: "4210.30",   reserve1: "625.18",      tvlUSD: 42_174_000, volume24h: 2_200_000, apr: 10.52 },
    { address: "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5", chainId: 1, token0: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", token1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", token0Symbol: "USDC", token1Symbol: "DAI",  feeTier: "0.05%", reserve0: "18200000", reserve1: "18184000",    tvlUSD: 36_384_000, volume24h: 8_100_000, apr: 22.70 },
    { address: "0xd3d2E2692501A5c9Ca623199D38826e513033a17", chainId: 1, token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", token1: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", token0Symbol: "ETH",  token1Symbol: "UNI",  feeTier: "0.3%",  reserve0: "3150.90",   reserve1: "963450.00",  tvlUSD: 22_344_000, volume24h: 1_450_000, apr:  9.21 },
    { address: "0xa478c2975Ab1Ea89e8196811F51A7B7Ade33eB11", chainId: 1, token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", token1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", token0Symbol: "ETH",  token1Symbol: "DAI",  feeTier: "0.3%",  reserve0: "6840.10",   reserve1: "24224195.00", tvlUSD: 48_448_390, volume24h: 3_620_000, apr: 12.38 },
  ];

  for (const pool of pools) {
    await prisma.pool.upsert({
      where: { address_chainId: { address: pool.address, chainId: pool.chainId } },
      update: { tvlUSD: pool.tvlUSD, volume24h: pool.volume24h, apr: pool.apr, reserve0: pool.reserve0, reserve1: pool.reserve1 },
      create: pool,
    });
  }
  console.log(`  ✓  ${pools.length} pools`);

  // ── Farms ──────────────────────────────────────────────────────────────────
  const farms = [
    { pid: 0, chainId: 1, name: "ETH-USDC LP", lpToken: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc", token0Symbol: "ETH",  token1Symbol: "USDC", rewardSymbol: "JINK", aprPercent: 124.5, tvlUSD: 8_420_000, multiplier: "40x" },
    { pid: 1, chainId: 1, name: "ETH-USDT LP", lpToken: "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852", token0Symbol: "ETH",  token1Symbol: "USDT", rewardSymbol: "JINK", aprPercent:  98.2, tvlUSD: 6_100_000, multiplier: "30x" },
    { pid: 2, chainId: 1, name: "ETH-WBTC LP", lpToken: "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940", token0Symbol: "ETH",  token1Symbol: "WBTC", rewardSymbol: "JINK", aprPercent:  76.4, tvlUSD: 4_830_000, multiplier: "20x" },
    { pid: 3, chainId: 1, name: "USDC-DAI LP", lpToken: "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5", token0Symbol: "USDC", token1Symbol: "DAI",  rewardSymbol: "JINK", aprPercent:  42.1, tvlUSD: 2_960_000, multiplier: "10x" },
    { pid: 4, chainId: 1, name: "ETH-UNI LP",  lpToken: "0xd3d2E2692501A5c9Ca623199D38826e513033a17", token0Symbol: "ETH",  token1Symbol: "UNI",  rewardSymbol: "JINK", aprPercent:  58.9, tvlUSD: 1_750_000, multiplier: "15x" },
  ];

  for (const farm of farms) {
    await prisma.farm.upsert({
      where: { pid_chainId: { pid: farm.pid, chainId: farm.chainId } },
      update: { aprPercent: farm.aprPercent, tvlUSD: farm.tvlUSD },
      create: farm,
    });
  }
  console.log(`  ✓  ${farms.length} farms`);

  // ── Quests ─────────────────────────────────────────────────────────────────
  const now = new Date();
  const questsData = [
    {
      title: "JinkFi Genesis Campaign",
      description: "Be among the first to explore JinkFi DEX. Complete social, onchain and quiz tasks to earn exclusive genesis rewards.",
      projectName: "JinkFi",
      startDate: new Date(now.getTime() - 86400000 * 2),
      endDate:   new Date(now.getTime() + 86400000 * 14),
      featured: true,
      tags: ["DeFi", "DEX", "Genesis"],
      tasks: [
        { type: "twitter_follow",  title: "Follow @JinkFi on X",           description: "Follow our official X account.",               points: 50,  required: true,  order: 1, link: "https://x.com" },
        { type: "twitter_retweet", title: "Retweet the launch post",        description: "Retweet our launch announcement post.",         points: 75,  required: false, order: 2, link: "https://x.com" },
        { type: "discord_join",    title: "Join JinkFi Discord",            description: "Join our community Discord server.",            points: 50,  required: true,  order: 3, link: "https://discord.com" },
        { type: "quiz",            title: "What is concentrated liquidity?",description: "Answer a question about Uniswap V3.",           points: 100, required: false, order: 4, metadata: { options: ["Providing liquidity across the full price range", "Providing liquidity within a custom price range", "Locking tokens for a fixed period", "A type of yield farming strategy"], answer: "Providing liquidity within a custom price range" } },
        { type: "onchain",         title: "Make your first swap",           description: "Complete any token swap on JinkFi DEX.",        points: 150, required: false, order: 5 },
        { type: "onchain",         title: "Add liquidity",                  description: "Add liquidity to any pool on JinkFi.",          points: 75,  required: false, order: 6 },
      ],
      rewards: [
        { type: "token", symbol: "JINK", amount: "1000", label: "1,000 JINK" },
        { type: "nft",   label: "Genesis OG Badge NFT" },
      ],
    },
    {
      title: "Perps Pioneer",
      description: "Explore the JinkFi perpetuals trading platform. Open your first position and trade like a pro.",
      projectName: "JinkFi Perps",
      startDate: new Date(now.getTime() - 86400000),
      endDate:   new Date(now.getTime() + 86400000 * 7),
      featured: true,
      tags: ["Perps", "Trading", "Leverage"],
      tasks: [
        { type: "quiz",    title: "What is a perpetual contract?", description: "Test your knowledge of perpetual futures.", points: 75,  required: false, order: 1, metadata: { options: ["A futures contract with no expiry date", "A spot trading position", "A liquidity pool token", "An NFT smart contract"], answer: "A futures contract with no expiry date" } },
        { type: "onchain", title: "Open a long position",          description: "Open any long position on JinkFi Perps.",  points: 150, required: true,  order: 2 },
        { type: "onchain", title: "Open a short position",         description: "Open any short position on JinkFi Perps.", points: 125, required: false, order: 3 },
      ],
      rewards: [
        { type: "token", symbol: "JINK", amount: "500", label: "500 JINK" },
      ],
    },
    {
      title: "Liquidity Provider Bootcamp",
      description: "Learn the difference between V2, V3 concentrated, and V4 hook-powered liquidity. Earn rewards for providing.",
      projectName: "JinkFi",
      startDate: new Date(now.getTime() - 86400000 * 5),
      endDate:   new Date(now.getTime() + 86400000 * 21),
      featured: false,
      tags: ["Liquidity", "V3", "V4", "Education"],
      tasks: [
        { type: "quiz",            title: "V2 vs V3 liquidity",   description: "What is the main advantage of V3 over V2?", points: 75,  required: false, order: 1, metadata: { options: ["V3 is cheaper to deploy", "V3 uses concentrated liquidity ranges", "V3 has lower gas fees", "V3 supports more tokens"], answer: "V3 uses concentrated liquidity ranges" } },
        { type: "onchain",         title: "Add V2 liquidity",     description: "Add liquidity to a V2 pool.",               points: 100, required: false, order: 2 },
        { type: "onchain",         title: "Create a V3 position", description: "Create a concentrated liquidity V3 position.", points: 150, required: false, order: 3 },
        { type: "twitter_follow",  title: "Follow for LP tips",   description: "Follow our LP strategy account.",           points: 75,  required: false, order: 4, link: "https://x.com" },
      ],
      rewards: [
        { type: "token", symbol: "JINK", amount: "750", label: "750 JINK" },
        { type: "nft",   label: "LP Master Badge" },
      ],
    },
    {
      title: "Token Locker Challenge",
      description: "Learn about token security by locking tokens with JinkFi Locker — the non-custodial lock protocol.",
      projectName: "JinkFi Locker",
      startDate: new Date(now.getTime() - 86400000),
      endDate:   new Date(now.getTime() + 86400000 * 30),
      featured: false,
      tags: ["Locker", "Security", "DeFi"],
      tasks: [
        { type: "onchain", title: "Lock any token",   description: "Lock any ERC-20 token using JinkFi Locker.", points: 150, required: true,  order: 1 },
        { type: "quiz",    title: "Why lock tokens?", description: "Understand the purpose of token locking.",   points: 100, required: false, order: 2, metadata: { options: ["To earn yield", "To signal commitment and prevent rug pulls", "To swap tokens", "To farm rewards"], answer: "To signal commitment and prevent rug pulls" } },
      ],
      rewards: [
        { type: "token", symbol: "JINK", amount: "300", label: "300 JINK" },
      ],
    },
  ];

  for (const qd of questsData) {
    const totalPoints = qd.tasks.reduce((s, t) => s + t.points, 0);
    const quest = await prisma.quest.create({
      data: {
        title: qd.title,
        description: qd.description,
        projectName: qd.projectName,
        startDate: qd.startDate,
        endDate: qd.endDate,
        featured: qd.featured,
        tags: qd.tags,
        totalPoints,
        tasks: { create: qd.tasks },
        rewards: { create: qd.rewards },
      },
    });
    console.log(`  ✓  Quest: ${quest.title}`);
  }

  console.log("\n✅  Seed complete.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
