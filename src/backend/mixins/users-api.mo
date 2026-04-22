import Types "../types/users";
import Common "../types/common";
import UsersLib "../lib/users";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

mixin (
  users : Map.Map<Principal, Types.User>,
  households : Map.Map<Text, Types.Household>,
  joinRequests : Map.Map<Text, Types.HouseholdJoinRequest>,
) {
  // ── Auth / User management ────────────────────────────────────────────────

  public shared ({ caller }) func registerOrGetUser(
    name : Text,
    email : Text,
  ) : async Common.Result<Types.User, Text> {
    if (caller.isAnonymous()) {
      return #err("Anonymous callers not allowed");
    };
    UsersLib.registerOrGet(users, caller, name, email)
  };

  public shared query ({ caller }) func getCurrentUser() : async Common.Result<Types.User, Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { #err("User not found") };
      case (?user) { #ok(user) };
    }
  };

  public shared ({ caller }) func updateDisplayName(
    displayName : Text,
  ) : async Common.Result<Types.User, Text> {
    UsersLib.updateDisplayName(users, caller, displayName)
  };

  public shared query ({ caller }) func getPendingUsers() : async Common.Result<[Types.User], Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isAdmin(user)) {
          return #err("Unauthorized");
        };
      };
    };
    #ok(UsersLib.getPending(users))
  };

  public shared query ({ caller }) func getUsers() : async Common.Result<[Types.User], Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isAdmin(user)) {
          return #err("Unauthorized");
        };
      };
    };
    #ok(UsersLib.getAll(users))
  };

  public shared ({ caller }) func approveUser(
    userId : Principal,
  ) : async Common.Result<Types.User, Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isAdmin(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.approveUser(users, userId)
  };

  public shared ({ caller }) func denyUser(
    userId : Principal,
  ) : async Common.Result<(), Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isAdmin(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.denyUser(users, userId)
  };

  public shared ({ caller }) func removeUser(
    userId : Principal,
  ) : async Common.Result<(), Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isAdmin(user)) {
          return #err("Unauthorized");
        };
      };
    };
    if (Principal.equal(caller, userId)) {
      return #err("Cannot remove yourself");
    };
    UsersLib.removeUser(users, userId)
  };

  public shared ({ caller }) func transferAdminRole(
    newAdminId : Principal,
  ) : async Common.Result<(), Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isAdmin(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.transferAdmin(users, caller, newAdminId)
  };

  public shared ({ caller }) func clearAllData() : async Common.Result<(), Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isAdmin(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.clearAllData(users, households, joinRequests, caller)
  };

  // ── Household management ──────────────────────────────────────────────────

  public shared query ({ caller }) func getHouseholds() : async Common.Result<[Types.Household], Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
      };
    };
    #ok(UsersLib.getHouseholds(households))
  };

  public shared ({ caller }) func createHousehold(
    name : Text,
  ) : async Common.Result<Types.Household, Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.createHousehold(households, users, caller, name)
  };

  public shared ({ caller }) func requestJoinHousehold(
    householdId : Text,
  ) : async Common.Result<(), Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.requestJoin(joinRequests, users, caller, householdId)
  };

  public shared query ({ caller }) func getHouseholdJoinRequests() : async Common.Result<[Types.HouseholdJoinRequest], Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.getJoinRequests(joinRequests, households, caller)
  };

  public shared ({ caller }) func approveJoinRequest(
    requestId : Text,
  ) : async Common.Result<(), Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.approveJoinRequest(joinRequests, households, users, caller, requestId)
  };

  public shared ({ caller }) func denyJoinRequest(
    requestId : Text,
  ) : async Common.Result<(), Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.denyJoinRequest(joinRequests, households, caller, requestId)
  };

  public shared ({ caller }) func renameHousehold(
    householdId : Text,
    newName : Text,
  ) : async Common.Result<Types.Household, Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.renameHousehold(households, users, caller, householdId, newName)
  };

  public shared ({ caller }) func leaveHousehold() : async Common.Result<(), Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.leaveHousehold(households, users, caller)
  };

  public shared query ({ caller }) func getHouseholdMembers(
    householdId : Text,
  ) : async Common.Result<[Types.User], Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.getHouseholdMembers(users, caller, householdId)
  };

  public shared ({ caller }) func removeHouseholdMember(
    userId : Principal,
  ) : async Common.Result<(), Text> {
    switch (UsersLib.getUser(users, caller)) {
      case null { return #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
      };
    };
    UsersLib.removeHouseholdMember(households, users, caller, userId)
  };
};
