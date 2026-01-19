import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CryptoHolding, StakingReward, UserProfile, TimeRange, PortfolioMetrics } from '../backend';

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

// Holdings Queries
export function useGetHoldings() {
  const { actor, isFetching } = useActor();

  return useQuery<CryptoHolding[]>({
    queryKey: ['holdings'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHoldings();
    },
    enabled: !!actor && !isFetching,
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
    mutationFn: async (params: {
      id: bigint;
      additionalAmount: number;
      additionalInvestmentGBP: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.incrementHolding(params.id, params.additionalAmount, params.additionalInvestmentGBP);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
    },
  });
}

// Staking Rewards Queries
export function useGetStakingRewards() {
  const { actor, isFetching } = useActor();

  return useQuery<StakingReward[]>({
    queryKey: ['stakingRewards'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStakingRewards();
    },
    enabled: !!actor && !isFetching,
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
  });
}
