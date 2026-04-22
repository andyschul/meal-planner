import IngredientTypes "types/ingredients";
import RecipeTypes "types/recipes";
import MealPlanTypes "types/mealplans";
import CartTypes "types/shoppingcart";
import UserTypes "types/users";
import IngredientsApi "mixins/ingredients-api";
import RecipesApi "mixins/recipes-api";
import MealPlansApi "mixins/mealplans-api";
import ShoppingCartApi "mixins/shoppingcart-api";
import UsersApi "mixins/users-api";
import Migration "migration";
import List "mo:core/List";
import Map "mo:core/Map";

(with migration = Migration.run)
actor {
  // ── Core data state ───────────────────────────────────────────────────────
  let ingredients = List.empty<IngredientTypes.Ingredient>();
  let customCategories = List.empty<Text>();
  let recipes = List.empty<RecipeTypes.Recipe>();
  let mealPlans = Map.empty<Text, MealPlanTypes.MealPlan>();
  let carts = Map.empty<Text, CartTypes.ShoppingCart>();

  // ── Auth / household state ────────────────────────────────────────────────
  let users = Map.empty<Principal, UserTypes.User>();
  let households = Map.empty<Text, UserTypes.Household>();
  let joinRequests = Map.empty<Text, UserTypes.HouseholdJoinRequest>();

  // ── Mixin composition ─────────────────────────────────────────────────────
  include UsersApi(users, households, joinRequests);
  include IngredientsApi(ingredients, customCategories, recipes, users);
  include RecipesApi(recipes, mealPlans, carts, ingredients, users);
  include MealPlansApi(mealPlans, recipes, ingredients, carts, users);
  include ShoppingCartApi(carts, mealPlans, recipes, ingredients, users);
};
