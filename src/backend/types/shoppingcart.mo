module {
  public type ShoppingCartItem = {
    ingredientId : Text;
    totalQuantity : Float;
    unit : Text;
    category : Text;
    checked : Bool;
    householdId : Text;
  };

  public type ShoppingCart = {
    weekStart : Text;
    householdId : Text;
    items : [ShoppingCartItem];
  };
};
