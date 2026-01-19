import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Types
  public type CryptoHolding = {
    id : Nat;
    symbol : Text;
    amount : Float;
    amountInvestedGBP : Float;
    currentValueGBP : Float;
  };

  public type StakingReward = {
    id : Nat;
    symbol : Text;
    amount : Float;
    rewardDate : Time.Time;
  };

  public type PortfolioMetrics = {
    totalValueGBP : Float;
    totalGainLossGBP : Float;
    percentageChange : Float;
  };

  public type TimeRange = {
    #day;
    #week;
    #month;
    #sixMonths;
    #year;
    #allTime;
  };

  public type UserProfile = {
    name : Text;
  };

  module CryptoHolding {
    public func compare(a : CryptoHolding, b : CryptoHolding) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module StakingReward {
    public func compare(a : StakingReward, b : StakingReward) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // State
  let holdings = Map.empty<Principal, Map.Map<Nat, CryptoHolding>>();
  let rewards = Map.empty<Principal, Map.Map<Nat, StakingReward>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextHoldingId = 0;
  var nextRewardId = 0;

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
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

  // Portfolio Management - Holdings
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

  public shared ({ caller }) func incrementHolding(id : Nat, additionalAmount : Float, additionalInvestmentGBP : Float) : async () {
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
          holding with
          amount = holding.amount + additionalAmount;
          amountInvestedGBP = holding.amountInvestedGBP + additionalInvestmentGBP;
        };
        userHoldings.add(id, updatedHolding);
      };
    };
  };

  // Portfolio Management - Staking Rewards
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

  // Query Functions
  public query ({ caller }) func getHoldings() : async [CryptoHolding] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view holdings");
    };

    switch (holdings.get(caller)) {
      case (null) { [] };
      case (?map) { map.values().toArray().sort() };
    };
  };

  public query ({ caller }) func getStakingRewards() : async [StakingReward] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view staking rewards");
    };

    switch (rewards.get(caller)) {
      case (null) { [] };
      case (?map) { map.values().toArray().sort() };
    };
  };

  // Portfolio Metrics (Stubbed for now)
  public query ({ caller }) func getPortfolioMetrics(_timeRange : TimeRange) : async PortfolioMetrics {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view portfolio metrics");
    };

    // Placeholder values, actual calculation will be implemented later
    {
      totalValueGBP = 0.0;
      totalGainLossGBP = 0.0;
      percentageChange = 0.0;
    };
  };
};
