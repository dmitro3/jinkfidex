import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { questApi } from "../api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useQuests() {
  return useQuery({ queryKey: ["quests"], queryFn: () => questApi.list(), staleTime: 60_000, retry: false });
}

export function useQuest(id: string) {
  return useQuery({ queryKey: ["quest", id], queryFn: () => questApi.get(id), staleTime: 60_000, retry: false });
}

export function useLeaderboard(questId: string) {
  return useQuery({ queryKey: ["leaderboard", questId], queryFn: () => questApi.leaderboard(questId), staleTime: 30_000 });
}

export function useQuestProgress(questId: string) {
  const { isConnected } = useAccount();
  return useQuery({
    queryKey: ["progress", questId],
    queryFn: () => questApi.progress(questId),
    enabled: isConnected,
    staleTime: 10_000,
  });
}

export function useVerifyTask(questId: string) {
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, boolean>>({});

  const verify = useCallback(async (taskId: string, answer?: string, txHash?: string, twitterUserId?: string, discordUserId?: string) => {
    setVerifying(taskId);
    try {
      const result = await questApi.verifyTask(questId, taskId, { answer, txHash, twitterUserId, discordUserId });
      setResults(prev => ({ ...prev, [taskId]: result.success }));
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["progress", questId] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard", questId] });
      }
      return result;
    } finally {
      setVerifying(null);
    }
  }, [questId, queryClient]);

  return { verifying, results, verify };
}
