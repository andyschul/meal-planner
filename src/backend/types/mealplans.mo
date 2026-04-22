module {
  public type Day = {
    #monday;
    #tuesday;
    #wednesday;
    #thursday;
    #friday;
    #saturday;
    #sunday;
  };

  public type Meal = { #breakfast; #lunch; #dinner };

  public type MealSlot = {
    day : Day;
    meal : Meal;
    recipeId : Text;
  };

  public type MealPlan = {
    id : Text;
    weekStart : Text;
    householdId : Text;
    slots : [MealSlot];
  };

  public type MealPlanTemplate = {
    id : Text;
    name : Text;
    householdId : Text;
    slots : [MealSlot];
    createdAt : Int;
  };
};
