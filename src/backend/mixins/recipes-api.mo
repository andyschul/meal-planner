import Types "../types/recipes";
import UserTypes "../types/users";
import MealPlanTypes "../types/mealplans";
import CartTypes "../types/shoppingcart";
import IngredientTypes "../types/ingredients";
import Common "../types/common";
import RecipesLib "../lib/recipes";
import UsersLib "../lib/users";
import MealPlansLib "../lib/mealplans";
import List "mo:core/List";
import Map "mo:core/Map";

mixin (
  recipes : List.List<Types.Recipe>,
  mealPlans : Map.Map<Text, MealPlanTypes.MealPlan>,
  carts : Map.Map<Text, CartTypes.ShoppingCart>,
  ingredients : List.List<IngredientTypes.Ingredient>,
  users : Map.Map<Principal, UserTypes.User>,
) {
  func requireApprovedRecipes(caller : Principal) : ?Text {
    switch (UsersLib.getUser(users, caller)) {
      case null { ?"Unauthorized" };
      case (?user) {
        if (not UsersLib.isApproved(user)) { ?"Unauthorized" } else { null };
      };
    }
  };

  public shared query ({ caller }) func getRecipes() : async [Types.Recipe] {
    switch (requireApprovedRecipes(caller)) {
      case (?_) { [] };
      case null { RecipesLib.getAll(recipes) };
    }
  };

  public shared query ({ caller }) func getRecipe(id : Text) : async ?Types.Recipe {
    switch (requireApprovedRecipes(caller)) {
      case (?_) { null };
      case null { RecipesLib.getById(recipes, id) };
    }
  };

  public shared ({ caller }) func createRecipe(
    name : Text,
    recipeIngredients : [Types.RecipeIngredient],
    instructionType : Text,
    steps : [Text],
    freetext : Text,
    prepTime : Nat,
    cookTime : Nat,
    servings : Nat,
    tags : [Text],
    imageId : ?Text,
    notes : Text,
  ) : async Common.Result<Types.Recipe, Text> {
    switch (requireApprovedRecipes(caller)) {
      case (?e) { return #err(e) };
      case null {};
    };
    RecipesLib.create(recipes, caller, name, recipeIngredients, instructionType, steps, freetext, prepTime, cookTime, servings, tags, imageId, notes)
  };

  public shared ({ caller }) func updateRecipe(
    id : Text,
    name : Text,
    recipeIngredients : [Types.RecipeIngredient],
    instructionType : Text,
    steps : [Text],
    freetext : Text,
    prepTime : Nat,
    cookTime : Nat,
    servings : Nat,
    tags : [Text],
    imageId : ?Text,
    notes : Text,
  ) : async Common.Result<Types.Recipe, Text> {
    switch (requireApprovedRecipes(caller)) {
      case (?e) { return #err(e) };
      case null {};
    };
    RecipesLib.update(recipes, id, name, recipeIngredients, instructionType, steps, freetext, prepTime, cookTime, servings, tags, imageId, notes)
  };

  public shared ({ caller }) func deleteRecipe(id : Text) : async Common.Result<Text, Text> {
    switch (requireApprovedRecipes(caller)) {
      case (?e) { return #err(e) };
      case null {};
    };
    // Also remove from all meal plans
    ignore MealPlansLib.removeRecipeFromAllPlans(mealPlans, id);
    RecipesLib.delete(recipes, id)
  };

  public shared ({ caller }) func toggleFavorite(id : Text) : async Common.Result<Types.Recipe, Text> {
    switch (requireApprovedRecipes(caller)) {
      case (?e) { return #err(e) };
      case null {};
    };
    RecipesLib.toggleFavorite(recipes, id)
  };

  public shared query ({ caller }) func getAllTags() : async [Text] {
    switch (requireApprovedRecipes(caller)) {
      case (?_) { [] };
      case null { RecipesLib.getAllTags(recipes) };
    }
  };
};
