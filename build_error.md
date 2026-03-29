> server@1.0.0 build
> tsc

src/config/db.ts:9:5 - error TS2322: Type 'string | undefined' is not assignable to type 'never'.
  Type 'undefined' is not assignable to type 'never'.

9     datasourceUrl: process.env.DATABASE_URL,
      ~~~~~~~~~~~~~

src/controllers/auth.controller.ts:12:38 - error TS2339: Property 'toLowerCase' does not exist on type 'string | string[]'.
  Property 'toLowerCase' does not exist on type 'string[]'.

12   const address = req.params.address.toLowerCase();
                                        ~~~~~~~~~~~

src/controllers/lock.controller.ts:46:56 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

46   const lock = await prisma.lock.findUnique({ where: { id: req.params.id } });
                                                          ~~

  node_modules/.prisma/client/index.d.ts:17967:5
    17967     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'LockWhereUniqueInput'

src/controllers/lock.controller.ts:84:56 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

84   const lock = await prisma.lock.findUnique({ where: { id: req.params.id } });
                                                          ~~

  node_modules/.prisma/client/index.d.ts:17967:5
    17967     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'LockWhereUniqueInput'

src/controllers/lock.controller.ts:91:14 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

91     where: { id: req.params.id },
                ~~

  node_modules/.prisma/client/index.d.ts:17967:5
    17967     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'LockWhereUniqueInput'

src/controllers/perps.controller.ts:123:66 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

123   const sub = await prisma.perpsSubmission.findUnique({ where: { id } });
                                                                     ~~

  node_modules/.prisma/client/index.d.ts:17812:5
    17812     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'PerpsSubmissionWhereUniqueInput'

src/controllers/perps.controller.ts:128:14 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

128     where: { id },
                 ~~

  node_modules/.prisma/client/index.d.ts:17812:5
    17812     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'PerpsSubmissionWhereUniqueInput'

src/controllers/perps.controller.ts:140:66 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

140   const sub = await prisma.perpsSubmission.findUnique({ where: { id } });
                                                                     ~~

  node_modules/.prisma/client/index.d.ts:17812:5
    17812     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'PerpsSubmissionWhereUniqueInput'

src/controllers/perps.controller.ts:145:14 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

145     where: { id },
                 ~~

  node_modules/.prisma/client/index.d.ts:17812:5
    17812     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'PerpsSubmissionWhereUniqueInput'

src/controllers/pool.controller.ts:28:38 - error TS2339: Property 'toLowerCase' does not exist on type 'string | string[]'.
  Property 'toLowerCase' does not exist on type 'string[]'.

28   const address = req.params.address.toLowerCase();
                                        ~~~~~~~~~~~

src/controllers/quest.controller.ts:138:20 - error TS2554: Expected 2-3 arguments, but got 1.

138     metadata:    z.record(z.unknown()).optional(),
                       ~~~~~~

  node_modules/zod/v4/classic/schemas.d.cts:513:107
    513 export declare function record<Key extends core.$ZodRecordKey, Value extends core.SomeType>(keyType: Key, valueType: Value, params?: string | core.$ZodRecordParams): ZodRecord<Key, Value>;
                                                                                                                  ~~~~~~~~~~~~~~~~
    An argument for 'valueType' was not provided.

src/controllers/quest.controller.ts:185:7 - error TS2322: Type '{ type: string; title: string; description: string; points: number; required: boolean; link?: string | undefined; metadata?: Record<string | number | symbol, unknown> | undefined; }[]' is not assignable to type 'JsonNull | InputJsonValue'.
  Type '{ type: string; title: string; description: string; points: number; required: boolean; link?: string | undefined; metadata?: Record<string | number | symbol, unknown> | undefined; }[]' is not assignable to type 'InputJsonObject'.
    Index signature for type 'string' is missing in type '{ type: string; title: string; description: string; points: number; required: boolean; link?: string | undefined; metadata?: Record<string | number | symbol, unknown> | undefined; }[]'.

185       tasksJson:   body.tasks,
          ~~~~~~~~~

  node_modules/.prisma/client/index.d.ts:18787:5
    18787     tasksJson: JsonNullValueInput | InputJsonValue
              ~~~~~~~~~
    The expected type comes from property 'tasksJson' which is declared here on type '(Without<QuestSubmissionCreateInput, QuestSubmissionUncheckedCreateInput> & QuestSubmissionUncheckedCreateInput) | (Without<...> & QuestSubmissionCreateInput)'

src/controllers/quest.controller.ts:222:66 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

222   const sub = await prisma.questSubmission.findUnique({ where: { id: subId } });
                                                                     ~~

  node_modules/.prisma/client/index.d.ts:17483:5
    17483     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'QuestSubmissionWhereUniqueInput'

src/controllers/quest.controller.ts:267:16 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

267       where: { id: subId },
                   ~~

  node_modules/.prisma/client/index.d.ts:17483:5
    17483     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'QuestSubmissionWhereUniqueInput'

src/controllers/quest.controller.ts:283:66 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

283   const sub = await prisma.questSubmission.findUnique({ where: { id: subId } });
                                                                     ~~

  node_modules/.prisma/client/index.d.ts:17483:5
    17483     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'QuestSubmissionWhereUniqueInput'

src/controllers/quest.controller.ts:288:14 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

288     where: { id: subId },
                 ~~

  node_modules/.prisma/client/index.d.ts:17483:5
    17483     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'QuestSubmissionWhereUniqueInput'

src/controllers/quest.controller.ts:324:36 - error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.

324   const cacheKey = CacheKeys.quest(id);
                                       ~~

src/controllers/quest.controller.ts:329:14 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

329     where: { id },
                 ~~

  node_modules/.prisma/client/index.d.ts:17077:5
    17077     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'QuestWhereUniqueInput'

src/controllers/quest.controller.ts:339:55 - error TS2339: Property '_count' does not exist on type '{ id: string; createdAt: Date; updatedAt: Date; title: string; description: string; bannerUrl: string | null; projectName: string; projectLogo: string | null; startDate: Date; ... 5 more ...; tags: string[]; }'.

339   const result = { ...quest, totalParticipants: quest._count.progress };
                                                          ~~~~~~

src/controllers/quest.controller.ts:347:47 - error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.

347   const cacheKey = CacheKeys.questLeaderboard(id);
                                                  ~~

src/controllers/quest.controller.ts:352:14 - error TS2322: Type 'string | string[]' is not assignable to type 'string | StringFilter<"QuestProgress"> | undefined'.
  Type 'string[]' is not assignable to type 'string | StringFilter<"QuestProgress"> | undefined'.

352     where: { questId: id },
                 ~~~~~~~

src/controllers/quest.controller.ts:364:15 - error TS2322: Type 'string | string[]' is not assignable to type 'string | StringFilter<"QuestTask"> | undefined'.
  Type 'string[]' is not assignable to type 'string | StringFilter<"QuestTask"> | undefined'.

364       task: { questId: id },
                  ~~~~~~~

src/controllers/quest.controller.ts:368:78 - error TS18048: 'c._count' is possibly 'undefined'.

368   const countMap = Object.fromEntries(completionCounts.map((c) => [c.userId, c._count.taskId]));
                                                                                 ~~~~~~~~

src/controllers/quest.controller.ts:368:87 - error TS2339: Property 'taskId' does not exist on type 'true | { id?: number | undefined; userId?: number | undefined; taskId?: number | undefined; completedAt?: number | undefined; _all?: number | undefined; }'.
  Property 'taskId' does not exist on type 'true'.

368   const countMap = Object.fromEntries(completionCounts.map((c) => [c.userId, c._count.taskId]));
                                                                                          ~~~~~~

src/controllers/quest.controller.ts:372:20 - error TS2339: Property 'user' does not exist on type '{ id: string; createdAt: Date; updatedAt: Date; userId: string; completedAt: Date | null; questId: string; pointsEarned: number; completed: boolean; }'.

372     address: entry.user.address,
                       ~~~~

src/controllers/quest.controller.ts:373:21 - error TS2339: Property 'user' does not exist on type '{ id: string; createdAt: Date; updatedAt: Date; userId: string; completedAt: Date | null; questId: string; pointsEarned: number; completed: boolean; }'.

373     username: entry.user.username,
                        ~~~~

src/controllers/quest.controller.ts:387:54 - error TS2322: Type 'string | string[]' is not assignable to type 'string'.
  Type 'string[]' is not assignable to type 'string'.

387     where: { userId_questId: { userId: req.user!.id, questId: id } },
                                                         ~~~~~~~

src/controllers/quest.controller.ts:391:44 - error TS2322: Type 'string | string[]' is not assignable to type 'string | StringFilter<"QuestTask"> | undefined'.
  Type 'string[]' is not assignable to type 'string | StringFilter<"QuestTask"> | undefined'.

391     where: { userId: req.user!.id, task: { questId: id } },
                                               ~~~~~~~

src/controllers/quest.controller.ts:413:53 - error TS2322: Type 'string | string[]' is not assignable to type 'string'.
  Type 'string[]' is not assignable to type 'string'.

413     where: { userId_taskId: { userId: req.user!.id, taskId } },
                                                        ~~~~~~

src/controllers/quest.controller.ts:418:14 - error TS2322: Type 'string | string[]' is not assignable to type 'string | StringFilter<"QuestTask"> | undefined'.
  Type 'string[]' is not assignable to type 'string | StringFilter<"QuestTask"> | undefined'.

418     where: { id: taskId, questId },
                 ~~

src/controllers/quest.controller.ts:418:26 - error TS2322: Type 'string | string[]' is not assignable to type 'string | StringFilter<"QuestTask"> | undefined'.
  Type 'string[]' is not assignable to type 'string | StringFilter<"QuestTask"> | undefined'.

418     where: { id: taskId, questId },
                             ~~~~~~~

src/controllers/quest.controller.ts:459:37 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

459       data: { userId: req.user!.id, taskId },
                                        ~~~~~~

  node_modules/.prisma/client/index.d.ts:18711:5
    18711     taskId: string
              ~~~~~~
    The expected type comes from property 'taskId' which is declared here on type '(Without<TaskCompletionCreateInput, TaskCompletionUncheckedCreateInput> & TaskCompletionUncheckedCreateInput) | (Without<...> & TaskCompletionCreateInput)'

src/controllers/quest.controller.ts:463:56 - error TS2322: Type 'string | string[]' is not assignable to type 'string'.
  Type 'string[]' is not assignable to type 'string'.

463       where: { userId_questId: { userId: req.user!.id, questId } },
                                                           ~~~~~~~

src/controllers/quest.controller.ts:464:39 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

464       create: { userId: req.user!.id, questId, pointsEarned: task.points },
                                          ~~~~~~~

  node_modules/.prisma/client/index.d.ts:18640:5
    18640     questId: string
              ~~~~~~~
    The expected type comes from property 'questId' which is declared here on type '(Without<QuestProgressCreateInput, QuestProgressUncheckedCreateInput> & QuestProgressUncheckedCreateInput) | (Without<...> & QuestProgressCreateInput)'

src/controllers/quest.controller.ts:470:45 - error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'.
  Type 'string[]' is not assignable to type 'string'.

470   await cacheDel(CacheKeys.questLeaderboard(questId));
                                                ~~~~~~~

src/controllers/staking.controller.ts:121:68 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

121   const sub = await prisma.stakingSubmission.findUnique({ where: { id } });
                                                                       ~~

  node_modules/.prisma/client/index.d.ts:17636:5
    17636     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'StakingSubmissionWhereUniqueInput'

src/controllers/staking.controller.ts:126:14 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

126     where: { id },
                 ~~

  node_modules/.prisma/client/index.d.ts:17636:5
    17636     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'StakingSubmissionWhereUniqueInput'

src/controllers/staking.controller.ts:138:68 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

138   const sub = await prisma.stakingSubmission.findUnique({ where: { id } });
                                                                       ~~

  node_modules/.prisma/client/index.d.ts:17636:5
    17636     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'StakingSubmissionWhereUniqueInput'

src/controllers/staking.controller.ts:143:14 - error TS2322: Type 'string | string[]' is not assignable to type 'string | undefined'.
  Type 'string[]' is not assignable to type 'string'.

143     where: { id },
                 ~~

  node_modules/.prisma/client/index.d.ts:17636:5
    17636     id?: string
              ~~
    The expected type comes from property 'id' which is declared here on type 'StakingSubmissionWhereUniqueInput'

src/middleware/errorHandler.ts:23:20 - error TS2339: Property 'errors' does not exist on type 'ZodError<unknown>'.

23       details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
                      ~~~~~~

src/middleware/errorHandler.ts:23:32 - error TS7006: Parameter 'e' implicitly has an 'any' type.

23       details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
                                  ~


Found 41 errors in 8 files.

Errors  Files
     1  src/config/db.ts:9
     1  src/controllers/auth.controller.ts:12
     3  src/controllers/lock.controller.ts:46
     4  src/controllers/perps.controller.ts:123
     1  src/controllers/pool.controller.ts:28
    25  src/controllers/quest.controller.ts:138
     4  src/controllers/staking.controller.ts:121
     2  src/middleware/errorHandler.ts:23
> client@0.0.0 build
> tsc -b && vite build

src/hooks/useFarm.ts:29:5 - error TS2322: Type '[bigint] | undefined' is not assignable to type 'readonly [_pid: bigint, _user: `0x${string}`] | undefined'.
  Type '[bigint]' is not assignable to type 'readonly [_pid: bigint, _user: `0x${string}`]'.
    Source has 1 element(s) but target requires 2.

29     args: address ? [BigInt(farm.pid)] : undefined,
       ~~~~

src/hooks/useLocker.ts:109:26 - error TS2352: Conversion of type 'readonly number[] | undefined' to type 'bigint[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  The type 'readonly number[]' is 'readonly' and cannot be assigned to the mutable type 'bigint[]'.

109   const myTokenCalls = ((myTokenIds as bigint[]) ?? []).map(id => ({
                             ~~~~~~~~~~~~~~~~~~~~~~

src/hooks/useLocker.ts:114:23 - error TS2352: Conversion of type 'readonly number[] | undefined' to type 'bigint[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  The type 'readonly number[]' is 'readonly' and cannot be assigned to the mutable type 'bigint[]'.

114   const myLpCalls = ((myLpIds as bigint[]) ?? []).map(id => ({
                          ~~~~~~~~~~~~~~~~~~~

src/pages/LeaderboardPage.tsx:10:10 - error TS6133: 'fmtUSD' is declared but its value is never read.

10 function fmtUSD(n: number) {
            ~~~~~~

src/pages/LockerPage.tsx:526:58 - error TS6133: 'address' is declared but its value is never read.

526 function CreateLockDrawer({ mode, onModeChange, onClose, address, isConnected, onCreated, onCreateLock }: {
                                                             ~~~~~~~

src/pages/ProfilePage.tsx:147:10 - error TS6133: 'Sparkline' is declared but its value is never read.

147 function Sparkline({ data, color = "var(--accent)", height = 48 }: { data: number[]; color?: string; height?: number }) {
             ~~~~~~~~~

src/pages/ProfilePage.tsx:217:9 - error TS6133: 'sparkData' is declared but its value is never read.

217   const sparkData = [82, 79, 85, 91, 88, 94, 90, 87, 92, 98, 95, 102, 99, 108, 104, 110, 107, 115, 112, 118, 114, 122, 119, 125, 121, 128, 124, 131, 127, 134];
            ~~~~~~~~~

src/pages/StakingPage.tsx:6:10 - error TS6133: 'fmtUSD' is declared but its value is never read.

6 function fmtUSD(n: number) {
           ~~~~~~

src/pages/StakingPage.tsx:24:9 - error TS6133: 'totalTVL' is declared but its value is never read.

24   const totalTVL = 0; // no on-chain TVL read yet
           ~~~~~~~~


Found 9 errors.	 