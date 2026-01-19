import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldCryptoHolding = {
    id : Nat;
    symbol : Text;
    amount : Float;
    currentValueGBP : Float;
  };

  type OldActor = {
    holdings : Map.Map<Principal, Map.Map<Nat, OldCryptoHolding>>;
  };

  type NewCryptoHolding = {
    id : Nat;
    symbol : Text;
    amount : Float;
    amountInvestedGBP : Float;
    currentValueGBP : Float;
  };

  type NewActor = {
    holdings : Map.Map<Principal, Map.Map<Nat, NewCryptoHolding>>;
  };

  public func run(old : OldActor) : NewActor {
    let newHoldings = old.holdings.map<Principal, Map.Map<Nat, OldCryptoHolding>, Map.Map<Nat, NewCryptoHolding>>(
      func(_principal, oldMap) {
        oldMap.map<Nat, OldCryptoHolding, NewCryptoHolding>(
          func(_id, oldHolding) {
            {
              oldHolding with
              amountInvestedGBP = 0.0;
            };
          }
        );
      }
    );
    { old with holdings = newHoldings };
  };
};
