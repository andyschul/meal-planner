import Types "../types/recipes";
import Common "../types/common";
import List "mo:core/List";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

module {
  public type Recipe = Types.Recipe;
  public type RecipeIngredient = Types.RecipeIngredient;
  public type Result<T, E> = Common.Result<T, E>;

  public func getAll(
    recipes : List.List<Recipe>
  ) : [Recipe] {
    recipes.toArray()
  };

  public func getById(
    recipes : List.List<Recipe>,
    id : Text,
  ) : ?Recipe {
    recipes.find(func(r) { r.id == id })
  };

  public func create(
    recipes : List.List<Recipe>,
    caller : Principal,
    name : Text,
    ingredients : [RecipeIngredient],
    instructionType : Text,
    steps : [Text],
    freetext : Text,
    prepTime : Nat,
    cookTime : Nat,
    servings : Nat,
    tags : [Text],
    imageId : ?Text,
    notes : Text,
  ) : Result<Recipe, Text> {
    if (name == "") {
      return #err("Recipe name is required");
    };
    let instrType = parseInstructionType(instructionType);
    switch (instrType) {
      case null { return #err("Invalid instruction type: must be 'steps' or 'freetext'") };
      case (?_) {};
    };
    let now = Time.now();
    let id = "rec_" # now.toText();
    let recipe : Recipe = {
      id;
      name;
      ingredients;
      instructionType = switch (instrType) { case (?t) t; case null Runtime.trap("unreachable") };
      steps;
      freetext;
      prepTime;
      cookTime;
      servings;
      tags;
      imageId;
      notes;
      isFavorite = false;
      createdAt = now;
      updatedAt = now;
      createdBy = caller;
    };
    recipes.add(recipe);
    #ok(recipe)
  };

  public func update(
    recipes : List.List<Recipe>,
    id : Text,
    name : Text,
    ingredients : [RecipeIngredient],
    instructionType : Text,
    steps : [Text],
    freetext : Text,
    prepTime : Nat,
    cookTime : Nat,
    servings : Nat,
    tags : [Text],
    imageId : ?Text,
    notes : Text,
  ) : Result<Recipe, Text> {
    if (name == "") {
      return #err("Recipe name is required");
    };
    let instrType = parseInstructionType(instructionType);
    switch (instrType) {
      case null { return #err("Invalid instruction type: must be 'steps' or 'freetext'") };
      case (?_) {};
    };
    var found = false;
    var updated : ?Recipe = null;
    let now = Time.now();
    recipes.mapInPlace(func(r) {
      if (r.id == id) {
        found := true;
        let u : Recipe = {
          r with
          name;
          ingredients;
          instructionType = switch (instrType) { case (?t) t; case null Runtime.trap("unreachable") };
          steps;
          freetext;
          prepTime;
          cookTime;
          servings;
          tags;
          imageId;
          notes;
          updatedAt = now;
        };
        updated := ?u;
        u
      } else { r }
    });
    if (not found) {
      return #err("Recipe not found");
    };
    switch (updated) {
      case (?u) { #ok(u) };
      case null { Runtime.trap("unreachable") };
    }
  };

  public func delete(
    recipes : List.List<Recipe>,
    id : Text,
  ) : Result<Text, Text> {
    let exists = recipes.find(func(r) { r.id == id });
    switch (exists) {
      case null { return #err("Recipe not found") };
      case (?_) {};
    };
    let filtered = recipes.filter(func(r) { r.id != id });
    recipes.clear();
    recipes.append(filtered);
    #ok(id)
  };

  public func toggleFavorite(
    recipes : List.List<Recipe>,
    id : Text,
  ) : Result<Recipe, Text> {
    var found = false;
    var updated : ?Recipe = null;
    recipes.mapInPlace(func(r) {
      if (r.id == id) {
        found := true;
        let u = { r with isFavorite = not r.isFavorite };
        updated := ?u;
        u
      } else { r }
    });
    if (not found) {
      return #err("Recipe not found");
    };
    switch (updated) {
      case (?u) { #ok(u) };
      case null { Runtime.trap("unreachable") };
    }
  };

  public func getAllTags(
    recipes : List.List<Recipe>
  ) : [Text] {
    let tagSet = Set.empty<Text>();
    for (recipe in recipes.values()) {
      for (tag in recipe.tags.values()) {
        tagSet.add(tag);
      };
    };
    tagSet.toArray()
  };

  // Remove a specific ingredient from all recipes (cascade delete)
  public func removeIngredientFromAll(
    recipes : List.List<Recipe>,
    ingredientId : Text,
  ) {
    recipes.mapInPlace(func(r) {
      let filtered = r.ingredients.filter(func(ri) { ri.ingredientId != ingredientId });
      { r with ingredients = filtered }
    })
  };

  // Remove recipe from meal plan slots — called by meal plan logic
  public func existsById(
    recipes : List.List<Recipe>,
    id : Text,
  ) : Bool {
    switch (recipes.find(func(r) { r.id == id })) {
      case (?_) true;
      case null false;
    }
  };

  func parseInstructionType(t : Text) : ?Types.InstructionType {
    if (t == "steps") { ?#steps }
    else if (t == "freetext") { ?#freetext }
    else { null }
  };
};
