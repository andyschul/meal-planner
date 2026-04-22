import Types "../types/ingredients";
import Common "../types/common";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

module {
  public type Ingredient = Types.Ingredient;
  public type Result<T, E> = Common.Result<T, E>;

  let presetCategories : [Text] = [
    "Bakery",
    "Beverages",
    "Condiments & Sauces",
    "Dairy",
    "Frozen",
    "Meat & Poultry",
    "Other",
    "Pantry / Dry Goods",
    "Produce",
    "Seafood",
    "Snacks",
    "Spices & Seasonings",
  ];

  public func getAll(
    ingredients : List.List<Ingredient>
  ) : [Ingredient] {
    ingredients.toArray()
  };

  public func getById(
    ingredients : List.List<Ingredient>,
    id : Text,
  ) : ?Ingredient {
    ingredients.find(func(i) { i.id == id })
  };

  public func create(
    ingredients : List.List<Ingredient>,
    name : Text,
    category : Text,
    defaultUnit : Text,
  ) : Result<Ingredient, Text> {
    if (name == "") {
      return #err("Name is required");
    };
    let nameLower = name.toLower();
    let exists = ingredients.find(func(i) { i.name.toLower() == nameLower });
    switch (exists) {
      case (?_) { return #err("An ingredient with this name already exists") };
      case null {};
    };
    let id = generateId(name, Time.now());
    let ingredient : Ingredient = {
      id;
      name;
      category;
      defaultUnit;
      createdAt = Time.now();
    };
    ingredients.add(ingredient);
    #ok(ingredient)
  };

  public func update(
    ingredients : List.List<Ingredient>,
    id : Text,
    name : Text,
    category : Text,
    defaultUnit : Text,
  ) : Result<Ingredient, Text> {
    if (name == "") {
      return #err("Name is required");
    };
    let nameLower = name.toLower();
    let duplicate = ingredients.find(func(i) {
      i.id != id and i.name.toLower() == nameLower
    });
    switch (duplicate) {
      case (?_) { return #err("An ingredient with this name already exists") };
      case null {};
    };
    var found = false;
    var updated : ?Ingredient = null;
    ingredients.mapInPlace(func(i) {
      if (i.id == id) {
        found := true;
        let u = { i with name; category; defaultUnit };
        updated := ?u;
        u
      } else { i }
    });
    if (not found) {
      return #err("Ingredient not found");
    };
    switch (updated) {
      case (?u) { #ok(u) };
      case null { Runtime.trap("unreachable") };
    }
  };

  public func delete(
    ingredients : List.List<Ingredient>,
    id : Text,
  ) : Result<Text, Text> {
    let exists = ingredients.find(func(i) { i.id == id });
    switch (exists) {
      case null { return #err("Ingredient not found") };
      case (?_) {};
    };
    let filtered = ingredients.filter(func(i) { i.id != id });
    ingredients.clear();
    ingredients.append(filtered);
    #ok(id)
  };

  public func getCategories(
    customCategories : List.List<Text>
  ) : [Text] {
    let all = List.fromArray(presetCategories);
    for (c in customCategories.values()) {
      let exists = all.find(func(x) { x.toLower() == c.toLower() });
      switch (exists) {
        case null { all.add(c) };
        case (?_) {};
      };
    };
    all.sortInPlace(func(a, b) = a.compare(b));
    all.toArray()
  };

  public func addCategory(
    customCategories : List.List<Text>,
    name : Text,
  ) : Result<Text, Text> {
    if (name == "") {
      return #err("Category name is required");
    };
    let nameLower = name.toLower();
    // Check against presets
    let presetExists = presetCategories.find(func(c) { c.toLower() == nameLower });
    switch (presetExists) {
      case (?_) { return #err("This category already exists") };
      case null {};
    };
    // Check against custom categories
    let customExists = customCategories.find(func(c) { c.toLower() == nameLower });
    switch (customExists) {
      case (?_) { return #err("This category already exists") };
      case null {};
    };
    customCategories.add(name);
    #ok(name)
  };

  // Remove a specific ingredient from recipe ingredient lists (helper for delete with cascade)
  public func usedInRecipesCount<R>(
    recipes : List.List<R>,
    ingredientId : Text,
    getIngredients : R -> [{ ingredientId : Text }],
  ) : Nat {
    var count = 0;
    for (recipe in recipes.values()) {
      let ings = getIngredients(recipe);
      let found = ings.find(func(ri) { ri.ingredientId == ingredientId });
      switch (found) {
        case (?_) { count += 1 };
        case null {};
      };
    };
    count
  };

  func generateId(name : Text, ts : Int) : Text {
    "ing_" # name.toLower().replace(#char ' ', "_") # "_" # debug_show(ts)
  };
};
