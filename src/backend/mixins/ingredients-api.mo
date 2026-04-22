import Types "../types/ingredients";
import UserTypes "../types/users";
import Common "../types/common";
import IngredientsLib "../lib/ingredients";
import UsersLib "../lib/users";
import RecipesLib "../lib/recipes";
import RecipeTypes "../types/recipes";
import List "mo:core/List";
import Map "mo:core/Map";

mixin (
  ingredients : List.List<Types.Ingredient>,
  customCategories : List.List<Text>,
  recipes : List.List<RecipeTypes.Recipe>,
  users : Map.Map<Principal, UserTypes.User>,
) {
  func requireApproved(caller : Principal) : ?Text {
    switch (UsersLib.getUser(users, caller)) {
      case null { ?"Unauthorized" };
      case (?user) {
        if (not UsersLib.isApproved(user)) { ?"Unauthorized" } else { null };
      };
    }
  };

  public shared query ({ caller }) func getIngredients() : async [Types.Ingredient] {
    switch (requireApproved(caller)) {
      case (?_) { [] };
      case null { IngredientsLib.getAll(ingredients) };
    }
  };

  public shared query ({ caller }) func getIngredient(id : Text) : async ?Types.Ingredient {
    switch (requireApproved(caller)) {
      case (?_) { null };
      case null { IngredientsLib.getById(ingredients, id) };
    }
  };

  public shared ({ caller }) func createIngredient(
    name : Text,
    category : Text,
    defaultUnit : Text,
  ) : async Common.Result<Types.Ingredient, Text> {
    switch (requireApproved(caller)) {
      case (?e) { return #err(e) };
      case null {};
    };
    IngredientsLib.create(ingredients, name, category, defaultUnit)
  };

  public shared ({ caller }) func updateIngredient(
    id : Text,
    name : Text,
    category : Text,
    defaultUnit : Text,
  ) : async Common.Result<Types.Ingredient, Text> {
    switch (requireApproved(caller)) {
      case (?e) { return #err(e) };
      case null {};
    };
    IngredientsLib.update(ingredients, id, name, category, defaultUnit)
  };

  public shared ({ caller }) func deleteIngredient(id : Text) : async Common.Result<Text, Text> {
    switch (requireApproved(caller)) {
      case (?e) { return #err(e) };
      case null {};
    };
    // Cascade: remove from all recipes
    RecipesLib.removeIngredientFromAll(recipes, id);
    IngredientsLib.delete(ingredients, id)
  };

  public shared query ({ caller }) func getCategories() : async [Text] {
    switch (requireApproved(caller)) {
      case (?_) { [] };
      case null { IngredientsLib.getCategories(customCategories) };
    }
  };

  public shared ({ caller }) func addCategory(name : Text) : async Common.Result<Text, Text> {
    switch (requireApproved(caller)) {
      case (?e) { return #err(e) };
      case null {};
    };
    IngredientsLib.addCategory(customCategories, name)
  };
};
