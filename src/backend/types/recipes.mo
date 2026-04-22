module {
  public type InstructionType = { #steps; #freetext };

  public type RecipeIngredient = {
    ingredientId : Text;
    quantity : Float;
    unit : Text;
  };

  public type Recipe = {
    id : Text;
    name : Text;
    createdBy : Principal;
    ingredients : [RecipeIngredient];
    instructionType : InstructionType;
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
};
