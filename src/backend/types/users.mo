module {
  public type Role = { #admin; #member; #pending };

  public type User = {
    principalId : Principal;
    displayName : Text;
    householdId : ?Text;
    role : Role;
    createdAt : Int;
    name : Text;
    email : Text;
  };

  public type Household = {
    id : Text;
    name : Text;
    createdBy : Principal;
    createdAt : Int;
  };

  public type HouseholdJoinRequest = {
    id : Text;
    householdId : Text;
    requesterId : Principal;
    requesterName : Text;
    createdAt : Int;
  };
};
