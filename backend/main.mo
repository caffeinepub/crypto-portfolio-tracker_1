import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import List "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

import CryptoHolding "cryptoHolding";
import StakingReward "stakingReward";
import PortfolioMetrics "portfolioMetrics";
import PortfolioHistoryRecord "portfolioHistoryRecord";
import LivePortfolioSnapshot "livePortfolioSnapshot";
import UserProfile "userProfile";
import TimeRange "timeRange";


actor {
  type CryptoHolding = CryptoHolding.CryptoHolding;
  type StakingReward = StakingReward.StakingReward;
  type PortfolioMetrics = PortfolioMetrics.PortfolioMetrics;
  type PortfolioHistoryRecord = PortfolioHistoryRecord.PortfolioHistoryRecord;
  type LivePortfolioSnapshot = LivePortfolioSnapshot.LivePortfolioSnapshot;
  type TimeRange = TimeRange.TimeRange;
  type UserProfile = UserProfile.UserProfile;
  type HoldingsState = Map.Map<Principal, Map.Map<Nat, CryptoHolding>>;
  type RewardsState = Map.Map<Principal, Map.Map<Nat, StakingReward>>;
  type HistoryState = Map.Map<Principal, Map.Map<Time.Time, PortfolioHistoryRecord>>;
  type SnapshotsState = Map.Map<Principal, Map.Map<Time.Time, LivePortfolioSnapshot>>;
  type UserProfilesState = Map.Map<Principal, UserProfile>;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let holdings = Map.empty<Principal, Map.Map<Nat, CryptoHolding>>();
  let rewards = Map.empty<Principal, Map.Map<Nat, StakingReward>>();
  let portfolioHistory = Map.empty<Principal, Map.Map<Time.Time, PortfolioHistoryRecord>>();
  let liveSnapshots = Map.empty<Principal, Map.Map<Time.Time, LivePortfolioSnapshot>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextHoldingId = 0;
  var nextRewardId = 0;

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addHolding(symbol : Text, amount : Float, amountInvestedGBP : Float, currentValueGBP : Float) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add holdings");
    };
    let holding : CryptoHolding = {
      id = nextHoldingId;
      symbol;
      amount;
      amountInvestedGBP;
      currentValueGBP;
    };
    let userHoldings = switch (holdings.get(caller)) {
      case (null) { Map.empty<Nat, CryptoHolding>() };
      case (?map) { map };
    };
    userHoldings.add(nextHoldingId, holding);
    holdings.add(caller, userHoldings);
    nextHoldingId += 1;
    holding.id;
  };

  public shared ({ caller }) func updateHolding(id : Nat, symbol : Text, amount : Float, amountInvestedGBP : Float, currentValueGBP : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update holdings");
    };
    let userHoldings = switch (holdings.get(caller)) {
      case (null) { Runtime.trap("Holding not found") };
      case (?map) { map };
    };
    switch (userHoldings.get(id)) {
      case (null) { Runtime.trap("Holding not found") };
      case (?_) {
        let updatedHolding : CryptoHolding = {
          id;
          symbol;
          amount;
          amountInvestedGBP;
          currentValueGBP;
        };
        userHoldings.add(id, updatedHolding);
      };
    };
  };

  public shared ({ caller }) func deleteHolding(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete holdings");
    };
    let userHoldings = switch (holdings.get(caller)) {
      case (null) { Runtime.trap("Holding not found") };
      case (?map) { map };
    };
    if (not userHoldings.containsKey(id)) {
      Runtime.trap("Holding not found");
    };
    userHoldings.remove(id);
  };

  public shared ({ caller }) func incrementHolding(id : Nat, additionalInvestmentGBP : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can increment holdings");
    };
    let userHoldings = switch (holdings.get(caller)) {
      case (null) { Runtime.trap("Holding not found") };
      case (?map) { map };
    };
    switch (userHoldings.get(id)) {
      case (null) { Runtime.trap("Holding not found") };
      case (?holding) {
        let updatedHolding : CryptoHolding = {
          holding with amountInvestedGBP = holding.amountInvestedGBP + additionalInvestmentGBP
        };
        userHoldings.add(id, updatedHolding);
      };
    };
  };

  public shared ({ caller }) func addStakingReward(symbol : Text, amount : Float, rewardDate : Time.Time) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add staking rewards");
    };
    let reward : StakingReward = {
      id = nextRewardId;
      symbol;
      amount;
      rewardDate;
    };
    let userRewards = switch (rewards.get(caller)) {
      case (null) { Map.empty<Nat, StakingReward>() };
      case (?map) { map };
    };
    userRewards.add(nextRewardId, reward);
    rewards.add(caller, userRewards);
    nextRewardId += 1;
    reward.id;
  };

  public shared ({ caller }) func updateStakingReward(id : Nat, symbol : Text, amount : Float, rewardDate : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update staking rewards");
    };
    let userRewards = switch (rewards.get(caller)) {
      case (null) { Runtime.trap("Staking reward not found") };
      case (?map) { map };
    };
    switch (userRewards.get(id)) {
      case (null) { Runtime.trap("Staking reward not found") };
      case (?_) {
        let updatedReward : StakingReward = {
          id;
          symbol;
          amount;
          rewardDate;
        };
        userRewards.add(id, updatedReward);
      };
    };
  };

  public shared ({ caller }) func deleteStakingReward(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete staking rewards");
    };
    let userRewards = switch (rewards.get(caller)) {
      case (null) { Runtime.trap("Staking reward not found") };
      case (?map) { map };
    };
    if (not userRewards.containsKey(id)) {
      Runtime.trap("Staking reward not found");
    };
    userRewards.remove(id);
  };

  public query ({ caller }) func getHoldings(sortBy : Text) : async [CryptoHolding] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view holdings");
    };
    let holdingsArray = switch (holdings.get(caller)) {
      case (null) { [] };
      case (?map) { map.values().toArray() };
    };
    let sortedHoldings = switch (sortBy) {
      case ("highestValue") {
        holdingsArray.sort(
          func(a, b) {
            if (a.currentValueGBP < b.currentValueGBP) { return #greater };
            if (a.currentValueGBP > b.currentValueGBP) { return #less };
            #equal;
          }
        );
      };
      case ("lowestValue") {
        holdingsArray.sort(
          func(a, b) {
            if (a.currentValueGBP > b.currentValueGBP) { return #greater };
            if (a.currentValueGBP < b.currentValueGBP) { return #less };
            #equal;
          }
        );
      };
      case ("highestGainLoss") {
        holdingsArray.sort(
          func(a, b) {
            let aGainLoss = a.currentValueGBP - a.amountInvestedGBP;
            let bGainLoss = b.currentValueGBP - b.amountInvestedGBP;
            if (aGainLoss < bGainLoss) { return #greater };
            if (aGainLoss > bGainLoss) { return #less };
            #equal;
          }
        );
      };
      case ("lowestGainLoss") {
        holdingsArray.sort(
          func(a, b) {
            let aGainLoss = a.currentValueGBP - a.amountInvestedGBP;
            let bGainLoss = b.currentValueGBP - b.amountInvestedGBP;
            if (aGainLoss > bGainLoss) { return #greater };
            if (aGainLoss < bGainLoss) { return #less };
            #equal;
          }
        );
      };
      case (_) { holdingsArray };
    };
    sortedHoldings;
  };

  public query ({ caller }) func getStakingRewards() : async [StakingReward] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view staking rewards");
    };
    switch (rewards.get(caller)) {
      case (null) { [] };
      case (?map) { map.values().toArray() };
    };
  };

  public shared ({ caller }) func addPortfolioHistoryRecord(timestamp : Time.Time, totalValueGBP : Float, totalInvestedGBP : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add portfolio history");
    };
    let record : PortfolioHistoryRecord = {
      timestamp;
      totalValueGBP;
      totalInvestedGBP;
    };
    let userHistory = switch (portfolioHistory.get(caller)) {
      case (null) { Map.empty<Time.Time, PortfolioHistoryRecord>() };
      case (?map) { map };
    };
    userHistory.add(timestamp, record);
    portfolioHistory.add(caller, userHistory);
  };

  public query ({ caller }) func getPortfolioHistory(fromTimestamp : Time.Time, toTimestamp : Time.Time) : async [PortfolioHistoryRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view portfolio history");
    };
    switch (portfolioHistory.get(caller)) {
      case (null) { [] };
      case (?map) {
        map.values().toArray().filter(
          func(record) { record.timestamp >= fromTimestamp and record.timestamp <= toTimestamp }
        );
      };
    };
  };

  public shared ({ caller }) func addLivePortfolioSnapshot(timestamp : Time.Time, totalValueGBP : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add portfolio snapshots");
    };
    let snapshot : LivePortfolioSnapshot = {
      timestamp;
      totalValueGBP;
    };
    let userSnapshots = switch (liveSnapshots.get(caller)) {
      case (null) { Map.empty<Time.Time, LivePortfolioSnapshot>() };
      case (?map) { map };
    };
    userSnapshots.add(timestamp, snapshot);
    liveSnapshots.add(caller, userSnapshots);
  };

  public query ({ caller }) func getLivePortfolioHistory(fromTimestamp : Time.Time, toTimestamp : Time.Time) : async [LivePortfolioSnapshot] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view live portfolio history");
    };
    switch (liveSnapshots.get(caller)) {
      case (null) { [] };
      case (?map) {
        map.values().toArray().filter(
          func(snapshot) { snapshot.timestamp >= fromTimestamp and snapshot.timestamp <= toTimestamp }
        );
      };
    };
  };

  public query ({ caller }) func getPortfolioMetrics(_timeRange : TimeRange) : async PortfolioMetrics {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view portfolio metrics");
    };
    { totalValueGBP = 0.0; totalGainLossGBP = 0.0; percentageChange = 0.0 };
  };

  public query ({ caller }) func getIndividualCryptoHistory(_symbol : Text, _fromTimestamp : Time.Time, _toTimestamp : Time.Time) : async [PortfolioHistoryRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view crypto history");
    };
    [];
  };
};
