-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "nonce" TEXT NOT NULL,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "projectName" TEXT NOT NULL,
    "projectLogo" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxParticipants" INTEGER,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestTask" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "minAmount" TEXT,
    "tokenSymbol" TEXT,
    "metadata" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestReward" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "symbol" TEXT,
    "amount" TEXT,
    "label" TEXT NOT NULL,

    CONSTRAINT "QuestReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestSubmission" (
    "id" TEXT NOT NULL,
    "submitterAddress" VARCHAR(42) NOT NULL,
    "paymentTxHash" VARCHAR(66) NOT NULL,
    "paymentChainId" INTEGER NOT NULL DEFAULT 1,
    "feePaid" TEXT NOT NULL DEFAULT '0.05',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectUrl" TEXT,
    "bannerUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "tags" TEXT[],
    "tasksJson" JSONB NOT NULL,
    "rewardsJson" JSONB NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedBy" VARCHAR(42),
    "reviewedAt" TIMESTAMP(3),
    "questId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakingSubmission" (
    "id" TEXT NOT NULL,
    "submitterAddress" VARCHAR(42) NOT NULL,
    "paymentTxHash" VARCHAR(66) NOT NULL,
    "paymentChainId" INTEGER NOT NULL DEFAULT 1,
    "feePaid" TEXT NOT NULL DEFAULT '0.05',
    "tokenAddress" VARCHAR(42) NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL,
    "tokenDecimals" INTEGER NOT NULL DEFAULT 18,
    "rewardTokenAddress" VARCHAR(42) NOT NULL,
    "rewardTokenSymbol" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 1,
    "apy" DOUBLE PRECISION NOT NULL,
    "lockDays" INTEGER NOT NULL DEFAULT 0,
    "minStake" TEXT NOT NULL DEFAULT '0',
    "maxStake" TEXT,
    "poolStartDate" TIMESTAMP(3) NOT NULL,
    "poolEndDate" TIMESTAMP(3) NOT NULL,
    "totalRewardBudget" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectUrl" TEXT,
    "logoUrl" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedBy" VARCHAR(42),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StakingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerpsSubmission" (
    "id" TEXT NOT NULL,
    "submitterAddress" VARCHAR(42) NOT NULL,
    "paymentTxHash" VARCHAR(66) NOT NULL,
    "paymentChainId" INTEGER NOT NULL DEFAULT 1,
    "feePaid" TEXT NOT NULL DEFAULT '0.05',
    "tokenAddress" VARCHAR(42) NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL DEFAULT 'USDT',
    "chainId" INTEGER NOT NULL DEFAULT 1,
    "oracleType" TEXT NOT NULL DEFAULT 'chainlink',
    "oracleAddress" VARCHAR(42),
    "maxLeverage" INTEGER NOT NULL DEFAULT 100,
    "tradingFeeBps" INTEGER NOT NULL DEFAULT 10,
    "liquidationFeeBps" INTEGER NOT NULL DEFAULT 100,
    "initialMarginBps" INTEGER NOT NULL DEFAULT 100,
    "maintenanceMarginBps" INTEGER NOT NULL DEFAULT 50,
    "maxOILong" TEXT NOT NULL DEFAULT '1000000',
    "maxOIShort" TEXT NOT NULL DEFAULT '1000000',
    "initialLiquidity" TEXT NOT NULL DEFAULT '0',
    "description" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectUrl" TEXT,
    "logoUrl" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedBy" VARCHAR(42),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerpsSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lock" (
    "id" TEXT NOT NULL,
    "lockType" TEXT NOT NULL,
    "onChainId" INTEGER,
    "tokenAddress" VARCHAR(42) NOT NULL,
    "tokenSymbol" TEXT,
    "token0Symbol" TEXT,
    "token1Symbol" TEXT,
    "amount" TEXT NOT NULL,
    "owner" VARCHAR(42) NOT NULL,
    "unlockDate" TIMESTAMP(3) NOT NULL,
    "txHash" VARCHAR(66),
    "chainId" INTEGER NOT NULL,
    "withdrawn" BOOLEAN NOT NULL DEFAULT false,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Lock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "chainId" INTEGER NOT NULL,
    "token0" VARCHAR(42) NOT NULL,
    "token1" VARCHAR(42) NOT NULL,
    "token0Symbol" TEXT NOT NULL,
    "token1Symbol" TEXT NOT NULL,
    "feeTier" TEXT NOT NULL DEFAULT '0.3%',
    "reserve0" TEXT NOT NULL DEFAULT '0',
    "reserve1" TEXT NOT NULL DEFAULT '0',
    "tvlUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "apr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "pid" INTEGER NOT NULL,
    "chainId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lpToken" VARCHAR(42) NOT NULL,
    "token0Symbol" TEXT NOT NULL,
    "token1Symbol" TEXT NOT NULL,
    "rewardSymbol" TEXT NOT NULL,
    "aprPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tvlUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "multiplier" TEXT NOT NULL DEFAULT '1x',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- CreateIndex
CREATE INDEX "User_address_idx" ON "User"("address");

-- CreateIndex
CREATE INDEX "Quest_active_featured_idx" ON "Quest"("active", "featured");

-- CreateIndex
CREATE INDEX "QuestTask_questId_idx" ON "QuestTask"("questId");

-- CreateIndex
CREATE INDEX "QuestProgress_questId_pointsEarned_idx" ON "QuestProgress"("questId", "pointsEarned");

-- CreateIndex
CREATE UNIQUE INDEX "QuestProgress_userId_questId_key" ON "QuestProgress"("userId", "questId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCompletion_userId_taskId_key" ON "TaskCompletion"("userId", "taskId");

-- CreateIndex
CREATE INDEX "QuestSubmission_submitterAddress_idx" ON "QuestSubmission"("submitterAddress");

-- CreateIndex
CREATE INDEX "QuestSubmission_status_idx" ON "QuestSubmission"("status");

-- CreateIndex
CREATE INDEX "StakingSubmission_submitterAddress_idx" ON "StakingSubmission"("submitterAddress");

-- CreateIndex
CREATE INDEX "StakingSubmission_status_idx" ON "StakingSubmission"("status");

-- CreateIndex
CREATE INDEX "PerpsSubmission_submitterAddress_idx" ON "PerpsSubmission"("submitterAddress");

-- CreateIndex
CREATE INDEX "PerpsSubmission_status_idx" ON "PerpsSubmission"("status");

-- CreateIndex
CREATE INDEX "Lock_owner_idx" ON "Lock"("owner");

-- CreateIndex
CREATE INDEX "Lock_tokenAddress_idx" ON "Lock"("tokenAddress");

-- CreateIndex
CREATE INDEX "Lock_chainId_lockType_idx" ON "Lock"("chainId", "lockType");

-- CreateIndex
CREATE INDEX "Pool_chainId_idx" ON "Pool"("chainId");

-- CreateIndex
CREATE UNIQUE INDEX "Pool_address_chainId_key" ON "Pool"("address", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "Farm_pid_chainId_key" ON "Farm"("pid", "chainId");

-- AddForeignKey
ALTER TABLE "QuestTask" ADD CONSTRAINT "QuestTask_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestReward" ADD CONSTRAINT "QuestReward_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestProgress" ADD CONSTRAINT "QuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "QuestTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lock" ADD CONSTRAINT "Lock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
