import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import RecipeTypes "types/recipes";
import MealPlanTypes "types/mealplans";
import CartTypes "types/shoppingcart";
import IngredientTypes "types/ingredients";
import UserTypes "types/users";

module {
  // ── Old types (inline — copied from .old/src/backend/types/) ─────────────

  type OldInstructionType = { #steps; #freetext };

  type OldRecipeIngredient = {
    ingredientId : Text;
    quantity : Float;
    unit : Text;
  };

  type OldRecipe = {
    id : Text;
    name : Text;
    ingredients : [OldRecipeIngredient];
    instructionType : OldInstructionType;
    steps : [Text];
    freetext : Text;
    prepTime : Nat;
    cookTime : Nat;
    servings : Nat;
    tags : [Text];
    imageId : ?Text;
    notes : Text;
    isFavorite : Bool;
    createdAt : Int;
    updatedAt : Int;
  };

  type OldDay = { #monday; #tuesday; #wednesday; #thursday; #friday; #saturday; #sunday };
  type OldMeal = { #breakfast; #lunch; #dinner };

  type OldMealSlot = {
    day : OldDay;
    meal : OldMeal;
    recipeId : Text;
  };

  type OldMealPlan = {
    id : Text;
    weekStart : Text;
    slots : [OldMealSlot];
  };

  type OldShoppingCartItem = {
    ingredientId : Text;
    totalQuantity : Float;
    unit : Text;
    category : Text;
    checked : Bool;
  };

  type OldShoppingCart = {
    weekStart : Text;
    items : [OldShoppingCartItem];
  };

  // ── State record types ────────────────────────────────────────────────────

  type OldActor = {
    ingredients : List.List<IngredientTypes.Ingredient>;
    customCategories : List.List<Text>;
    recipes : List.List<OldRecipe>;
    mealPlans : Map.Map<Text, OldMealPlan>;
    carts : Map.Map<Text, OldShoppingCart>;
  };

  type NewActor = {
    ingredients : List.List<IngredientTypes.Ingredient>;
    customCategories : List.List<Text>;
    recipes : List.List<RecipeTypes.Recipe>;
    mealPlans : Map.Map<Text, MealPlanTypes.MealPlan>;
    carts : Map.Map<Text, CartTypes.ShoppingCart>;
    users : Map.Map<Principal, UserTypes.User>;
    households : Map.Map<Text, UserTypes.Household>;
    joinRequests : Map.Map<Text, UserTypes.HouseholdJoinRequest>;
  };

  // ── Migration function ────────────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    // Anonymous principal as default owner for existing recipes
    let anonPrincipal = Principal.fromText("2vxsx-fae");

    // Migrate recipes: add createdBy field
    let recipes = old.recipes.map<OldRecipe, RecipeTypes.Recipe>(
      func(r) { { r with createdBy = anonPrincipal } }
    );

    // Migrate mealPlans: add householdId = ""
    let mealPlans = old.mealPlans.map<Text, OldMealPlan, MealPlanTypes.MealPlan>(
      func(_k, mp) { { mp with householdId = "" } }
    );

    // Migrate carts: add householdId = "" to cart and each item
    let carts = old.carts.map<Text, OldShoppingCart, CartTypes.ShoppingCart>(
      func(_k, cart) {
        let items = cart.items.map(
          func(item) { { item with householdId = "" } }
        );
        { cart with householdId = ""; items }
      }
    );

    {
      ingredients = old.ingredients;
      customCategories = old.customCategories;
      recipes;
      mealPlans;
      carts;
      users = Map.empty<Principal, UserTypes.User>();
      households = Map.empty<Text, UserTypes.Household>();
      joinRequests = Map.empty<Text, UserTypes.HouseholdJoinRequest>();
    };
  };
};
