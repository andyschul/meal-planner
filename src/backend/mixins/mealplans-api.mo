import MealPlanTypes "../types/mealplans";
import RecipeTypes "../types/recipes";
import IngredientTypes "../types/ingredients";
import CartTypes "../types/shoppingcart";
import UserTypes "../types/users";
import Common "../types/common";
import MealPlansLib "../lib/mealplans";
import UsersLib "../lib/users";
import Map "mo:core/Map";
import List "mo:core/List";

mixin (
  mealPlans : Map.Map<Text, MealPlanTypes.MealPlan>,
  recipes : List.List<RecipeTypes.Recipe>,
  ingredients : List.List<IngredientTypes.Ingredient>,
  carts : Map.Map<Text, CartTypes.ShoppingCart>,
  users : Map.Map<Principal, UserTypes.User>,
) {
  // Returns the caller's household id, or an error
  func requireHousehold(caller : Principal) : { #ok : Text; #err : Text } {
    switch (UsersLib.getUser(users, caller)) {
      case null { #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
        switch (user.householdId) {
          case null { #err("You must join or create a household to use the planner") };
          case (?hid) { #ok(hid) };
        };
      };
    }
  };

  public shared query ({ caller }) func getMealPlan(weekStart : Text) : async ?MealPlanTypes.MealPlan {
    let householdId = switch (requireHousehold(caller)) {
      case (#err(_)) { return null };
      case (#ok(hid)) { hid };
    };
    MealPlansLib.getMealPlanScoped(mealPlans, householdId, weekStart)
  };

  public shared ({ caller }) func assignRecipeToSlot(
    weekStart : Text,
    day : Text,
    meal : Text,
    recipeId : Text,
  ) : async Common.Result<MealPlanTypes.MealPlan, Text> {
    let householdId = switch (requireHousehold(caller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(hid)) { hid };
    };
    MealPlansLib.assignRecipeToSlot(mealPlans, weekStart, day, meal, recipeId, householdId)
  };

  public shared ({ caller }) func removeRecipeFromSlot(
    weekStart : Text,
    day : Text,
    meal : Text,
  ) : async Common.Result<MealPlanTypes.MealPlan, Text> {
    let householdId = switch (requireHousehold(caller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(hid)) { hid };
    };
    let key = MealPlansLib.planKey(householdId, weekStart);
    let plan = switch (MealPlansLib.getMealPlan(mealPlans, key)) {
      case null { return #err("No meal plan found for this week") };
      case (?p) { p };
    };
    if (plan.householdId != householdId) {
      return #err("Unauthorized");
    };
    MealPlansLib.removeRecipeFromSlot(mealPlans, key, day, meal)
  };

  public shared ({ caller }) func clearWeek(weekStart : Text) : async Common.Result<Text, Text> {
    let householdId = switch (requireHousehold(caller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(hid)) { hid };
    };
    let key = MealPlansLib.planKey(householdId, weekStart);
    switch (MealPlansLib.getMealPlan(mealPlans, key)) {
      case null { return #ok(weekStart) }; // nothing to clear
      case (?plan) {
        if (plan.householdId != householdId) {
          return #err("Unauthorized");
        };
      };
    };
    MealPlansLib.clearWeek(mealPlans, key)
  };
};
