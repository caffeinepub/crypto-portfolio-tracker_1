import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CryptoHolding, StakingReward, UserProfile, TimeRange, PortfolioMetrics, LivePortfolioSnapshot } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    gcTime: Infinity, // Never garbage collect user profile
    staleTime: Infinity, // Profile doesn't become stale
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Holdings Queries with bulletproof data persistence
export function useGetHoldings() {
  const { actor, isFetching } = useActor();

  return useQuery<CryptoHolding[]>({
    queryKey: ['holdings'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHoldings('');
    },
    enabled: !!actor && !isFetching,
    // BULLETPROOF: Holdings never become stale or get garbage collected
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Keep previous data during any refetch
    placeholderData: (previousData) => previousData,
  });
}

export function useAddHolding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      symbol: string;
      amount: number;
      amountInvestedGBP: number;
      currentValueGBP: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addHolding(params.symbol, params.amount, params.amountInvestedGBP, params.currentValueGBP);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
    },
  });
}

export function useUpdateHolding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      symbol: string;
      amount: number;
      amountInvestedGBP: number;
      currentValueGBP: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateHolding(params.id, params.symbol, params.amount, params.amountInvestedGBP, params.currentValueGBP);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
    },
  });
}

export function useDeleteHolding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteHolding(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
    },
  });
}

export function useIncrementHolding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; additionalInvestmentGBP: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.incrementHolding(params.id, params.additionalInvestmentGBP);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
    },
  });
}

// Staking Rewards Queries with bulletproof data persistence
export function useGetStakingRewards() {
  const { actor, isFetching } = useActor();

  return useQuery<StakingReward[]>({
    queryKey: ['stakingRewards'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStakingRewards();
    },
    enabled: !!actor && !isFetching,
    // BULLETPROOF: Staking rewards never become stale or get garbage collected
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Keep previous data during any refetch
    placeholderData: (previousData) => previousData,
  });
}

export function useAddStakingReward() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { symbol: string; amount: number; rewardDate: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addStakingReward(params.symbol, params.amount, params.rewardDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakingRewards'] });
    },
  });
}

export function useUpdateStakingReward() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; symbol: string; amount: number; rewardDate: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStakingReward(params.id, params.symbol, params.amount, params.rewardDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakingRewards'] });
    },
  });
}

export function useDeleteStakingReward() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteStakingReward(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakingRewards'] });
    },
  });
}

// Portfolio Metrics Query
export function useGetPortfolioMetrics(timeRange: TimeRange) {
  const { actor, isFetching } = useActor();

  return useQuery<PortfolioMetrics>({
    queryKey: ['portfolioMetrics', timeRange],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPortfolioMetrics(timeRange);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000, // 30 seconds
    gcTime: Infinity,
    placeholderData: (previousData) => previousData,
  });
}

// Live Portfolio Snapshot Management
export function useAddLivePortfolioSnapshot() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { timestamp: bigint; totalValueGBP: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addLivePortfolioSnapshot(params.timestamp, params.totalValueGBP);
    },
  });
}

export function useGetLivePortfolioHistory(fromTimestamp: bigint, toTimestamp: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<LivePortfolioSnapshot[]>({
    queryKey: ['livePortfolioHistory', fromTimestamp.toString(), toTimestamp.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLivePortfolioHistory(fromTimestamp, toTimestamp);
    },
    enabled: !!actor && !isFetching,
    staleTime: 8000, // 8 seconds - slightly less than 10-second refresh
    gcTime: Infinity, // Never garbage collect
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}
