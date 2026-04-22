import Types "../types/users";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  // ── User helpers ──────────────────────────────────────────────────────────

  public func isApproved(user : Types.User) : Bool {
    switch (user.role) {
      case (#admin or #member) { true };
      case (#pending) { false };
    }
  };

  public func isAdmin(user : Types.User) : Bool {
    switch (user.role) {
      case (#admin) { true };
      case (_) { false };
    }
  };

  public func getUser(
    users : Map.Map<Principal, Types.User>,
    principalId : Principal,
  ) : ?Types.User {
    users.get(principalId)
  };

  public func registerOrGet(
    users : Map.Map<Principal, Types.User>,
    principalId : Principal,
    name : Text,
    email : Text,
  ) : { #ok : Types.User; #err : Text } {
    // If already exists, return existing (idempotent)
    switch (users.get(principalId)) {
      case (?existing) { return #ok(existing) };
      case null {};
    };
    let now = Time.now();
    // First user ever becomes admin
    let role : Types.Role = if (users.size() == 0) { #admin } else { #pending };
    let user : Types.User = {
      principalId;
      displayName = name;
      householdId = null;
      role;
      createdAt = now;
      name;
      email;
    };
    users.add(principalId, user);
    #ok(user)
  };

  public func updateDisplayName(
    users : Map.Map<Principal, Types.User>,
    principalId : Principal,
    displayName : Text,
  ) : { #ok : Types.User; #err : Text } {
    switch (users.get(principalId)) {
      case null { return #err("User not found") };
      case (?user) {
        switch (user.role) {
          case (#pending) { return #err("Unauthorized") };
          case (_) {};
        };
        let updated = { user with displayName };
        users.add(principalId, updated);
        #ok(updated)
      };
    }
  };

  public func getPending(users : Map.Map<Principal, Types.User>) : [Types.User] {
    let result = List.empty<Types.User>();
    for ((_, user) in users.entries()) {
      switch (user.role) {
        case (#pending) { result.add(user) };
        case (_) {};
      };
    };
    result.toArray()
  };

  public func getAll(users : Map.Map<Principal, Types.User>) : [Types.User] {
    let result = List.empty<Types.User>();
    for ((_, user) in users.entries()) {
      result.add(user);
    };
    result.toArray()
  };

  public func approveUser(
    users : Map.Map<Principal, Types.User>,
    targetId : Principal,
  ) : { #ok : Types.User; #err : Text } {
    switch (users.get(targetId)) {
      case null { return #err("User not found") };
      case (?user) {
        switch (user.role) {
          case (#pending) {
            let updated = { user with role = #member };
            users.add(targetId, updated);
            #ok(updated)
          };
          case (_) { return #err("User is not pending") };
        };
      };
    }
  };

  public func denyUser(
    users : Map.Map<Principal, Types.User>,
    targetId : Principal,
  ) : { #ok : (); #err : Text } {
    switch (users.get(targetId)) {
      case null { return #err("User not found") };
      case (?_) {
        users.remove(targetId);
        #ok(())
      };
    }
  };

  public func removeUser(
    users : Map.Map<Principal, Types.User>,
    targetId : Principal,
  ) : { #ok : (); #err : Text } {
    switch (users.get(targetId)) {
      case null { return #err("User not found") };
      case (?_) {
        users.remove(targetId);
        #ok(())
      };
    }
  };

  public func transferAdmin(
    users : Map.Map<Principal, Types.User>,
    currentAdmin : Principal,
    newAdminId : Principal,
  ) : { #ok : (); #err : Text } {
    switch (users.get(newAdminId)) {
      case null { return #err("Target user not found") };
      case (?newAdmin) {
        switch (newAdmin.role) {
          case (#member) {
            // Demote current admin
            switch (users.get(currentAdmin)) {
              case (?admin) {
                users.add(currentAdmin, { admin with role = #member });
              };
              case null {};
            };
            // Promote new admin
            users.add(newAdminId, { newAdmin with role = #admin });
            #ok(())
          };
          case (_) { return #err("Target user must be a member") };
        };
      };
    }
  };

  // ── Household helpers ─────────────────────────────────────────────────────

  public func getHouseholds(households : Map.Map<Text, Types.Household>) : [Types.Household] {
    let result = List.empty<Types.Household>();
    for ((_, h) in households.entries()) {
      result.add(h);
    };
    result.toArray()
  };

  public func createHousehold(
    households : Map.Map<Text, Types.Household>,
    users : Map.Map<Principal, Types.User>,
    creatorId : Principal,
    name : Text,
  ) : { #ok : Types.Household; #err : Text } {
    if (name == "") {
      return #err("Household name is required");
    };
    let now = Time.now();
    let id = "hh_" # now.toText();
    let household : Types.Household = {
      id;
      name;
      createdBy = creatorId;
      createdAt = now;
    };
    households.add(id, household);
    // Update creator's householdId
    switch (users.get(creatorId)) {
      case (?user) {
        users.add(creatorId, { user with householdId = ?id });
      };
      case null {};
    };
    #ok(household)
  };

  public func requestJoin(
    joinRequests : Map.Map<Text, Types.HouseholdJoinRequest>,
    users : Map.Map<Principal, Types.User>,
    requesterId : Principal,
    householdId : Text,
  ) : { #ok : (); #err : Text } {
    // Check user doesn't already have a household
    switch (users.get(requesterId)) {
      case null { return #err("User not found") };
      case (?user) {
        switch (user.householdId) {
          case (?_) { return #err("You already belong to a household") };
          case null {};
        };
      };
    };
    let now = Time.now();
    let id = "jr_" # now.toText() # "_" # requesterId.toText();
    let requesterName = switch (users.get(requesterId)) {
      case (?u) { u.displayName };
      case null { requesterId.toText() };
    };
    let request : Types.HouseholdJoinRequest = {
      id;
      householdId;
      requesterId;
      requesterName;
      createdAt = now;
    };
    joinRequests.add(id, request);
    #ok(())
  };

  public func getJoinRequests(
    joinRequests : Map.Map<Text, Types.HouseholdJoinRequest>,
    households : Map.Map<Text, Types.Household>,
    callerId : Principal,
  ) : { #ok : [Types.HouseholdJoinRequest]; #err : Text } {
    // Collect all households where caller is creator
    let callerHouseholdIds = List.empty<Text>();
    for ((hid, h) in households.entries()) {
      if (Principal.equal(h.createdBy, callerId)) {
        callerHouseholdIds.add(hid);
      };
    };
    let result = List.empty<Types.HouseholdJoinRequest>();
    for ((_, req) in joinRequests.entries()) {
      if (callerHouseholdIds.find(func(hid) { hid == req.householdId }) != null) {
        result.add(req);
      };
    };
    #ok(result.toArray())
  };

  public func approveJoinRequest(
    joinRequests : Map.Map<Text, Types.HouseholdJoinRequest>,
    households : Map.Map<Text, Types.Household>,
    users : Map.Map<Principal, Types.User>,
    callerId : Principal,
    requestId : Text,
  ) : { #ok : (); #err : Text } {
    switch (joinRequests.get(requestId)) {
      case null { return #err("Join request not found") };
      case (?req) {
        // Verify caller is the household creator
        switch (households.get(req.householdId)) {
          case null { return #err("Household not found") };
          case (?h) {
            if (not Principal.equal(h.createdBy, callerId)) {
              return #err("Only the household creator can approve join requests");
            };
          };
        };
        // Set requester's householdId
        switch (users.get(req.requesterId)) {
          case null { return #err("Requester user not found") };
          case (?user) {
            users.add(req.requesterId, { user with householdId = ?req.householdId });
          };
        };
        // Remove the join request
        joinRequests.remove(requestId);
        #ok(())
      };
    }
  };

  public func denyJoinRequest(
    joinRequests : Map.Map<Text, Types.HouseholdJoinRequest>,
    households : Map.Map<Text, Types.Household>,
    callerId : Principal,
    requestId : Text,
  ) : { #ok : (); #err : Text } {
    switch (joinRequests.get(requestId)) {
      case null { return #err("Join request not found") };
      case (?req) {
        // Verify caller is the household creator
        switch (households.get(req.householdId)) {
          case null { return #err("Household not found") };
          case (?h) {
            if (not Principal.equal(h.createdBy, callerId)) {
              return #err("Only the household creator can deny join requests");
            };
          };
        };
        joinRequests.remove(requestId);
        #ok(())
      };
    }
  };

  public func renameHousehold(
    households : Map.Map<Text, Types.Household>,
    users : Map.Map<Principal, Types.User>,
    callerId : Principal,
    householdId : Text,
    newName : Text,
  ) : { #ok : Types.Household; #err : Text } {
    if (newName == "") {
      return #err("Household name is required");
    };
    // Check caller is a member of this household
    switch (users.get(callerId)) {
      case null { return #err("User not found") };
      case (?user) {
        switch (user.householdId) {
          case null { return #err("You do not belong to this household") };
          case (?hid) {
            if (hid != householdId) {
              return #err("You do not belong to this household");
            };
          };
        };
      };
    };
    switch (households.get(householdId)) {
      case null { return #err("Household not found") };
      case (?h) {
        let updated = { h with name = newName };
        households.add(householdId, updated);
        #ok(updated)
      };
    }
  };

  public func leaveHousehold(
    households : Map.Map<Text, Types.Household>,
    users : Map.Map<Principal, Types.User>,
    callerId : Principal,
  ) : { #ok : (); #err : Text } {
    let householdId : Text = switch (users.get(callerId)) {
      case null { return #err("User not found") };
      case (?user) {
        switch (user.householdId) {
          case null { return #err("You are not in a household") };
          case (?hid) { hid };
        };
      };
    };
    // Clear caller's householdId
    switch (users.get(callerId)) {
      case (?user) {
        users.add(callerId, { user with householdId = null });
      };
      case null {};
    };
    // Find remaining members
    let remaining = List.empty<Principal>();
    for ((pid, u) in users.entries()) {
      switch (u.householdId) {
        case (?hid) {
          if (hid == householdId and not Principal.equal(pid, callerId)) {
            remaining.add(pid);
          };
        };
        case null {};
      };
    };
    if (remaining.size() == 0) {
      // Last member left — delete the household
      households.remove(householdId);
    } else {
      // If the creator left, transfer ownership to first remaining member
      switch (households.get(householdId)) {
        case null {};
        case (?h) {
          if (Principal.equal(h.createdBy, callerId)) {
            switch (remaining.first()) {
              case (?newCreator) {
                households.add(householdId, { h with createdBy = newCreator });
              };
              case null {};
            };
          };
        };
      };
    };
    #ok(())
  };

  public func getHouseholdMembers(
    users : Map.Map<Principal, Types.User>,
    callerId : Principal,
    householdId : Text,
  ) : { #ok : [Types.User]; #err : Text } {
    // Verify caller is a member of this household
    switch (users.get(callerId)) {
      case null { return #err("User not found") };
      case (?user) {
        switch (user.householdId) {
          case null { return #err("You do not belong to this household") };
          case (?hid) {
            if (hid != householdId) {
              return #err("You do not belong to this household");
            };
          };
        };
      };
    };
    let result = List.empty<Types.User>();
    for ((_, u) in users.entries()) {
      switch (u.householdId) {
        case (?hid) {
          if (hid == householdId) {
            result.add(u);
          };
        };
        case null {};
      };
    };
    #ok(result.toArray())
  };

  public func removeHouseholdMember(
    households : Map.Map<Text, Types.Household>,
    users : Map.Map<Principal, Types.User>,
    callerId : Principal,
    targetId : Principal,
  ) : { #ok : (); #err : Text } {
    // Get the caller's household
    let callerHouseholdId : Text = switch (users.get(callerId)) {
      case null { return #err("Caller not found") };
      case (?user) {
        switch (user.householdId) {
          case null { return #err("You do not belong to a household") };
          case (?hid) { hid };
        };
      };
    };
    // Verify caller is the household creator
    switch (households.get(callerHouseholdId)) {
      case null { return #err("Household not found") };
      case (?h) {
        if (not Principal.equal(h.createdBy, callerId)) {
          return #err("Only the household creator can remove members");
        };
      };
    };
    // Clear the target's householdId
    switch (users.get(targetId)) {
      case null { return #err("Target user not found") };
      case (?user) {
        switch (user.householdId) {
          case null { return #err("Target user is not in a household") };
          case (?hid) {
            if (hid != callerHouseholdId) {
              return #err("Target user is not in your household");
            };
          };
        };
        users.add(targetId, { user with householdId = null });
        #ok(())
      };
    }
  };

  // ── Admin tools ───────────────────────────────────────────────────────────

  public func clearAllData(
    users : Map.Map<Principal, Types.User>,
    households : Map.Map<Text, Types.Household>,
    joinRequests : Map.Map<Text, Types.HouseholdJoinRequest>,
    callerId : Principal,
  ) : { #ok : (); #err : Text } {
    // Keep only the calling admin
    let adminUser = switch (users.get(callerId)) {
      case null { return #err("Admin user not found") };
      case (?u) { u };
    };
    users.clear();
    // Restore admin (without household)
    users.add(callerId, { adminUser with householdId = null });
    households.clear();
    joinRequests.clear();
    #ok(())
  };
};
