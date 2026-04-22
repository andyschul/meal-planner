import CartTypes "../types/shoppingcart";
import MealPlanTypes "../types/mealplans";
import RecipeTypes "../types/recipes";
import IngredientTypes "../types/ingredients";
import UserTypes "../types/users";
import Common "../types/common";
import CartLib "../lib/shoppingcart";
import UsersLib "../lib/users";
import Map "mo:core/Map";
import List "mo:core/List";

mixin (
  carts : Map.Map<Text, CartTypes.ShoppingCart>,
  mealPlans : Map.Map<Text, MealPlanTypes.MealPlan>,
  recipes : List.List<RecipeTypes.Recipe>,
  ingredients : List.List<IngredientTypes.Ingredient>,
  users : Map.Map<Principal, UserTypes.User>,
) {
  func requireHouseholdCart(caller : Principal) : { #ok : Text; #err : Text } {
    switch (UsersLib.getUser(users, caller)) {
      case null { #err("Unauthorized") };
      case (?user) {
        if (not UsersLib.isApproved(user)) {
          return #err("Unauthorized");
        };
        switch (user.householdId) {
          case null { #err("You must join or create a household to use the shopping cart") };
          case (?hid) { #ok(hid) };
        };
      };
    }
  };

  // Cart key is scoped by household: householdId + "|" + weekStart
  func cartKey(householdId : Text, weekStart : Text) : Text {
    householdId # "|" # weekStart
  };

  public shared query ({ caller }) func getShoppingCart(weekStart : Text) : async CartTypes.ShoppingCart {
    let householdId = switch (requireHouseholdCart(caller)) {
      case (#err(_)) { return { weekStart; householdId = ""; items = [] } };
      case (#ok(hid)) { hid };
    };
    let key = cartKey(householdId, weekStart);
    CartLib.getCart(carts, mealPlans, recipes, ingredients, key, householdId, weekStart)
  };

  public shared ({ caller }) func updateShoppingCartItem(
    weekStart : Text,
    ingredientId : Text,
    unit : Text,
    checked : Bool,
  ) : async Common.Result<Text, Text> {
    let householdId = switch (requireHouseholdCart(caller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(hid)) { hid };
    };
    let key = cartKey(householdId, weekStart);
    CartLib.updateItem(carts, key, ingredientId, unit, checked)
  };

  public shared ({ caller }) func uncheckAllCartItems(weekStart : Text) : async Common.Result<Text, Text> {
    let householdId = switch (requireHouseholdCart(caller)) {
      case (#err(e)) { return #err(e) };
      case (#ok(hid)) { hid };
    };
    let key = cartKey(householdId, weekStart);
    CartLib.uncheckAll(carts, key)
  };
};
