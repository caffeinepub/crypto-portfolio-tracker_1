import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { CryptoHolding, StakingReward, UserProfile, PortfolioHistoryRecord } from '../backend';

// ─── User Profile ────────────────────────────────────────────────────────────

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
    staleTime: Infinity,
    gcTime: Infinity,
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

// ─── Holdings ────────────────────────────────────────────────────────────────

export function useGetHoldings(sortBy = 'default') {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CryptoHolding[]>({
    queryKey: ['holdings', sortBy],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHoldings(sortBy);
    },
    enabled: !!actor && !actorFetching,
    staleTime: Infinity,
    gcTime: Infinity,
    placeholderData: (prev) => prev ?? [],
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useAddHolding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      symbol,
      amount,
      amountInvestedGBP,
      currentValueGBP,
    }: {
      symbol: string;
      amount: number;
      amountInvestedGBP: number;
      currentValueGBP: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addHolding(symbol, amount, amountInvestedGBP, currentValueGBP);
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
    mutationFn: async ({
      id,
      symbol,
      amount,
      amountInvestedGBP,
      currentValueGBP,
    }: {
      id: bigint;
      symbol: string;
      amount: number;
      amountInvestedGBP: number;
      currentValueGBP: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateHolding(id, symbol, amount, amountInvestedGBP, currentValueGBP);
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
    mutationFn: async ({
      id,
      additionalAmount,
      additionalInvestmentGBP,
      currentValueGBP,
      symbol,
      existingAmount,
      existingAmountInvestedGBP,
    }: {
      id: bigint;
      additionalAmount: number;
      additionalInvestmentGBP: number;
      currentValueGBP: number;
      symbol: string;
      existingAmount: number;
      existingAmountInvestedGBP: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Use updateHolding to update both amount and investment
      return actor.updateHolding(
        id,
        symbol,
        existingAmount + additionalAmount,
        existingAmountInvestedGBP + additionalInvestmentGBP,
        currentValueGBP,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
    },
  });
}

// ─── Staking Rewards ─────────────────────────────────────────────────────────

export function useGetStakingRewards() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<StakingReward[]>({
    queryKey: ['stakingRewards'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStakingRewards();
    },
    enabled: !!actor && !actorFetching,
    staleTime: Infinity,
    gcTime: Infinity,
    placeholderData: (prev) => prev ?? [],
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useAddStakingReward() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      symbol,
      amount,
      rewardDate,
    }: {
      symbol: string;
      amount: number;
      rewardDate: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addStakingReward(symbol, amount, rewardDate);
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
    mutationFn: async ({
      id,
      symbol,
      amount,
      rewardDate,
    }: {
      id: bigint;
      symbol: string;
      amount: number;
      rewardDate: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStakingReward(id, symbol, amount, rewardDate);
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

// ─── Portfolio History ────────────────────────────────────────────────────────

export function useGetPortfolioHistory(fromTimestamp: bigint, toTimestamp: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PortfolioHistoryRecord[]>({
    queryKey: ['portfolioHistory', fromTimestamp.toString(), toTimestamp.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPortfolioHistory(fromTimestamp, toTimestamp);
    },
    enabled: !!actor && !actorFetching,
    staleTime: Infinity,
    gcTime: Infinity,
    placeholderData: (prev) => prev ?? [],
  });
}
