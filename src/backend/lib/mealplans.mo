import Types "../types/mealplans";
import Common "../types/common";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";

module {
  public type MealPlan = Types.MealPlan;
  public type MealSlot = Types.MealSlot;
  public type Result<T, E> = Common.Result<T, E>;

  // Key for meal plan map: householdId + "|" + weekStart
  public func planKey(householdId : Text, weekStart : Text) : Text {
    householdId # "|" # weekStart
  };

  public func getMealPlan(
    mealPlans : Map.Map<Text, MealPlan>,
    weekStart : Text,
  ) : ?MealPlan {
    mealPlans.get(weekStart)
  };

  public func getMealPlanScoped(
    mealPlans : Map.Map<Text, MealPlan>,
    householdId : Text,
    weekStart : Text,
  ) : ?MealPlan {
    mealPlans.get(planKey(householdId, weekStart))
  };

  public func assignRecipeToSlot(
    mealPlans : Map.Map<Text, MealPlan>,
    weekStart : Text,
    day : Text,
    meal : Text,
    recipeId : Text,
    householdId : Text,
  ) : Result<MealPlan, Text> {
    let dayVariant = parseDay(day);
    let mealVariant = parseMeal(meal);
    switch (dayVariant, mealVariant) {
      case (null, _) { return #err("Invalid day: " # day) };
      case (_, null) { return #err("Invalid meal: " # meal) };
      case (?d, ?m) {
        let key = planKey(householdId, weekStart);
        let existingPlan = mealPlans.get(key);
        let currentSlots : [MealSlot] = switch (existingPlan) {
          case (?p) p.slots;
          case null [];
        };
        // Remove existing slot for same day+meal then add new one
        let filteredSlots = currentSlots.filter(func(s) {
          not (s.day == d and s.meal == m)
        });
        let newSlot : MealSlot = { day = d; meal = m; recipeId };
        let newSlots = filteredSlots.concat([newSlot]);
        let planId = switch (existingPlan) {
          case (?p) p.id;
          case null { "plan_" # householdId # "_" # weekStart };
        };
        let plan : MealPlan = { id = planId; weekStart; householdId; slots = newSlots };
        mealPlans.add(key, plan);
        #ok(plan)
      };
    }
  };

  public func removeRecipeFromSlot(
    mealPlans : Map.Map<Text, MealPlan>,
    weekStart : Text,
    day : Text,
    meal : Text,
  ) : Result<MealPlan, Text> {
    let dayVariant = parseDay(day);
    let mealVariant = parseMeal(meal);
    switch (dayVariant, mealVariant) {
      case (null, _) { return #err("Invalid day: " # day) };
      case (_, null) { return #err("Invalid meal: " # meal) };
      case (?d, ?m) {
        let existingPlan = mealPlans.get(weekStart);
        switch (existingPlan) {
          case null { return #err("No meal plan found for this week") };
          case (?plan) {
            let newSlots = plan.slots.filter(func(s) {
              not (s.day == d and s.meal == m)
            });
            let updated : MealPlan = { plan with slots = newSlots };
            mealPlans.add(weekStart, updated);
            #ok(updated)
          };
        };
      };
    }
  };

  public func clearWeek(
    mealPlans : Map.Map<Text, MealPlan>,
    weekStart : Text,
  ) : Result<Text, Text> {
    let existingPlan = mealPlans.get(weekStart);
    switch (existingPlan) {
      case null {
        // Nothing to clear, that's fine
        #ok(weekStart)
      };
      case (?plan) {
        let cleared : MealPlan = { plan with slots = [] };
        mealPlans.add(weekStart, cleared);
        #ok(weekStart)
      };
    }
  };

  // Remove a specific recipe from all meal plan slots across all weeks
  public func removeRecipeFromAllPlans(
    mealPlans : Map.Map<Text, MealPlan>,
    recipeId : Text,
  ) : [Text] {
    var affectedWeeks : [Text] = [];
    for ((key, plan) in mealPlans.entries()) {
      let hadSlot = plan.slots.find(func(s) { s.recipeId == recipeId });
      switch (hadSlot) {
        case (?_) {
          let newSlots = plan.slots.filter(func(s) { s.recipeId != recipeId });
          mealPlans.add(key, { plan with slots = newSlots });
          affectedWeeks := affectedWeeks.concat([plan.weekStart]);
        };
        case null {};
      };
    };
    affectedWeeks
  };

  public func parseDay(day : Text) : ?Types.Day {
    if (day == "monday") { ?#monday }
    else if (day == "tuesday") { ?#tuesday }
    else if (day == "wednesday") { ?#wednesday }
    else if (day == "thursday") { ?#thursday }
    else if (day == "friday") { ?#friday }
    else if (day == "saturday") { ?#saturday }
    else if (day == "sunday") { ?#sunday }
    else { null }
  };

  public func parseMeal(meal : Text) : ?Types.Meal {
    if (meal == "breakfast") { ?#breakfast }
    else if (meal == "lunch") { ?#lunch }
    else if (meal == "dinner") { ?#dinner }
    else { null }
  };
};
