import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PortfolioMetrics {
    totalValueGBP: number;
    totalGainLossGBP: number;
    percentageChange: number;
}
export type Time = bigint;
export interface StakingReward {
    id: bigint;
    rewardDate: bigint;
    amount: number;
    symbol: string;
}
export interface PortfolioHistoryRecord {
    totalValueGBP: number;
    timestamp: bigint;
    totalInvestedGBP: number;
}
export interface CryptoHolding {
    id: bigint;
    amountInvestedGBP: number;
    currentValueGBP: number;
    amount: number;
    symbol: string;
}
export interface UserProfile {
    name: string;
}
export interface LivePortfolioSnapshot {
    totalValueGBP: number;
    timestamp: bigint;
}
export enum TimeRange {
    day = "day",
    month = "month",
    hourlyLive = "hourlyLive",
    week = "week",
    year = "year",
    allTime = "allTime",
    sixMonths = "sixMonths"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addHolding(symbol: string, amount: number, amountInvestedGBP: number, currentValueGBP: number): Promise<bigint>;
    addLivePortfolioSnapshot(timestamp: Time, totalValueGBP: number): Promise<void>;
    addPortfolioHistoryRecord(timestamp: Time, totalValueGBP: number, totalInvestedGBP: number): Promise<void>;
    addStakingReward(symbol: string, amount: number, rewardDate: Time): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteHolding(id: bigint): Promise<void>;
    deleteStakingReward(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHoldings(sortBy: string): Promise<Array<CryptoHolding>>;
    getIndividualCryptoHistory(_symbol: string, _fromTimestamp: Time, _toTimestamp: Time): Promise<Array<PortfolioHistoryRecord>>;
    getLivePortfolioHistory(fromTimestamp: Time, toTimestamp: Time): Promise<Array<LivePortfolioSnapshot>>;
    getPortfolioHistory(fromTimestamp: Time, toTimestamp: Time): Promise<Array<PortfolioHistoryRecord>>;
    getPortfolioMetrics(_timeRange: TimeRange): Promise<PortfolioMetrics>;
    getStakingRewards(): Promise<Array<StakingReward>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    incrementHolding(id: bigint, additionalInvestmentGBP: number): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateHolding(id: bigint, symbol: string, amount: number, amountInvestedGBP: number, currentValueGBP: number): Promise<void>;
    updateStakingReward(id: bigint, symbol: string, amount: number, rewardDate: Time): Promise<void>;
}
