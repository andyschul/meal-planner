import CartTypes "../types/shoppingcart";
import RecipeTypes "../types/recipes";
import IngredientTypes "../types/ingredients";
import Common "../types/common";
import MealPlanTypes "../types/mealplans";
import MealPlansLib "mealplans";
import Map "mo:core/Map";
import List "mo:core/List";

module {
  public type ShoppingCart = CartTypes.ShoppingCart;
  public type ShoppingCartItem = CartTypes.ShoppingCartItem;
  public type Result<T, E> = Common.Result<T, E>;

  // Key for merging: ingredientId + "|" + unit
  func mergeKey(ingredientId : Text, unit : Text) : Text {
    ingredientId # "|" # unit
  };

  /// Regenerates cart items from the meal plan for a given week, scoped to a household.
  public func generateCart(
    mealPlans : Map.Map<Text, MealPlanTypes.MealPlan>,
    recipes : List.List<RecipeTypes.Recipe>,
    ingredients : List.List<IngredientTypes.Ingredient>,
    householdId : Text,
    weekStart : Text,
  ) : [ShoppingCartItem] {
    let planKey = MealPlansLib.planKey(householdId, weekStart);
    let plan = mealPlans.get(planKey);
    let slots : [MealPlanTypes.MealSlot] = switch (plan) {
      case null { return [] };
      case (?p) p.slots;
    };

    // Accumulate: mergeKey -> (ingredientId, unit, totalQty, category)
    let accumulator = Map.empty<Text, (Text, Text, Float, Text)>();

    for (slot in slots.values()) {
      let recipe = recipes.find(func(r) { r.id == slot.recipeId });
      switch (recipe) {
        case null {};
        case (?r) {
          for (ri in r.ingredients.values()) {
            let ingredient = ingredients.find(func(i) { i.id == ri.ingredientId });
            let category = switch (ingredient) {
              case null { "Other" };
              case (?ing) ing.category;
            };
            let key = mergeKey(ri.ingredientId, ri.unit);
            let existing = accumulator.get(key);
            switch (existing) {
              case null {
                accumulator.add(key, (ri.ingredientId, ri.unit, ri.quantity, category));
              };
              case (?(iid, unit, qty, cat)) {
                accumulator.add(key, (iid, unit, qty + ri.quantity, cat));
              };
            };
          };
        };
      };
    };

    let items = List.empty<ShoppingCartItem>();
    for ((_, (ingredientId, unit, totalQuantity, category)) in accumulator.entries()) {
      items.add({
        ingredientId;
        totalQuantity;
        unit;
        category;
        checked = false;
        householdId;
      });
    };
    items.toArray()
  };

  public func getCart(
    carts : Map.Map<Text, ShoppingCart>,
    mealPlans : Map.Map<Text, MealPlanTypes.MealPlan>,
    recipes : List.List<RecipeTypes.Recipe>,
    ingredients : List.List<IngredientTypes.Ingredient>,
    cartKey : Text,
    householdId : Text,
    weekStart : Text,
  ) : ShoppingCart {
    // Regenerate the computed items from the household-scoped meal plan
    let freshItems = generateCart(mealPlans, recipes, ingredients, householdId, weekStart);

    // Merge with persisted check states
    let existing = carts.get(cartKey);
    let checkedStates = Map.empty<Text, Bool>();
    switch (existing) {
      case null {};
      case (?cart) {
        for (item in cart.items.values()) {
          checkedStates.add(mergeKey(item.ingredientId, item.unit), item.checked);
        };
      };
    };

    let mergedItems = freshItems.map(func(item : ShoppingCartItem) : ShoppingCartItem {
      let key = mergeKey(item.ingredientId, item.unit);
      let checked = switch (checkedStates.get(key)) {
        case (?c) c;
        case null false;
      };
      { item with checked }
    });

    { weekStart; householdId; items = mergedItems }
  };

  public func updateItem(
    carts : Map.Map<Text, ShoppingCart>,
    cartKey : Text,
    ingredientId : Text,
    unit : Text,
    checked : Bool,
  ) : Result<Text, Text> {
    let existing = carts.get(cartKey);
    let currentItems : [ShoppingCartItem] = switch (existing) {
      case null { [] };
      case (?cart) cart.items;
    };
    let key = mergeKey(ingredientId, unit);
    var found = false;
    let updatedItems = currentItems.map(func(item : ShoppingCartItem) : ShoppingCartItem {
      if (mergeKey(item.ingredientId, item.unit) == key) {
        found := true;
        { item with checked }
      } else { item }
    });
    // If not found, add a placeholder to persist the state
    let finalItems = if (found) {
      updatedItems
    } else {
      updatedItems.concat([{
        ingredientId;
        totalQuantity = 0.0;
        unit;
        category = "";
        checked;
        householdId = switch (existing) { case (?cart) cart.householdId; case null { "" } };
      }])
    };
    let weekStart = switch (existing) {
      case (?cart) cart.weekStart;
      case null { cartKey }; // fallback
    };
    let householdId = switch (existing) {
      case (?cart) cart.householdId;
      case null { "" };
    };
    carts.add(cartKey, { weekStart; householdId; items = finalItems });
    #ok("updated")
  };

  public func uncheckAll(
    carts : Map.Map<Text, ShoppingCart>,
    cartKey : Text,
  ) : Result<Text, Text> {
    let existing = carts.get(cartKey);
    switch (existing) {
      case null { return #ok("no cart to uncheck") };
      case (?cart) {
        let updatedItems = cart.items.map(func(item : ShoppingCartItem) : ShoppingCartItem {
          { item with checked = false }
        });
        carts.add(cartKey, { cart with items = updatedItems });
        #ok("unchecked")
      };
    }
  };

  public func clearCart(
    carts : Map.Map<Text, ShoppingCart>,
    cartKey : Text,
  ) {
    carts.remove(cartKey)
  };
};
