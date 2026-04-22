import type { backendInterface, Ingredient, Recipe, MealPlan, ShoppingCart, User, Household, HouseholdJoinRequest } from "../backend";
import { Day, InstructionType, Meal, Role } from "../backend";
import { Principal } from "@icp-sdk/core/principal";

const MOCK_PRINCIPAL = Principal.fromText("2vxsx-fae");
const MOCK_HOUSEHOLD_ID = "household-1";

const sampleIngredients: Ingredient[] = [
  {
    id: "ing-1",
    name: "Chicken Breast",
    category: "Meat & Poultry",
    defaultUnit: "lbs",
    createdAt: BigInt(Date.now()),
  },
  {
    id: "ing-2",
    name: "Broccoli",
    category: "Produce",
    defaultUnit: "cups",
    createdAt: BigInt(Date.now()),
  },
  {
    id: "ing-3",
    name: "Olive Oil",
    category: "Pantry / Dry Goods",
    defaultUnit: "tbsp",
    createdAt: BigInt(Date.now()),
  },
  {
    id: "ing-4",
    name: "Garlic",
    category: "Produce",
    defaultUnit: "cloves",
    createdAt: BigInt(Date.now()),
  },
  {
    id: "ing-5",
    name: "Parmesan Cheese",
    category: "Dairy",
    defaultUnit: "oz",
    createdAt: BigInt(Date.now()),
  },
];

const sampleRecipes: Recipe[] = [
  {
    id: "rec-1",
    name: "Grilled Chicken & Broccoli",
    createdBy: MOCK_PRINCIPAL,
    ingredients: [
      { ingredientId: "ing-1", quantity: 1.5, unit: "lbs" },
      { ingredientId: "ing-2", quantity: 2, unit: "cups" },
      { ingredientId: "ing-3", quantity: 2, unit: "tbsp" },
      { ingredientId: "ing-4", quantity: 3, unit: "cloves" },
    ],
    instructionType: InstructionType.steps,
    steps: [
      "Preheat grill to medium-high heat.",
      "Season chicken with salt, pepper, and olive oil.",
      "Grill chicken 6-7 minutes per side until cooked through.",
      "Steam broccoli until tender, toss with garlic and olive oil.",
    ],
    freetext: "",
    prepTime: BigInt(15),
    cookTime: BigInt(20),
    servings: BigInt(4),
    tags: ["High Protein", "Healthy", "Quick"],
    isFavorite: true,
    notes: "Great for meal prep!",
    createdAt: BigInt(Date.now()),
    updatedAt: BigInt(Date.now()),
  },
  {
    id: "rec-2",
    name: "Pasta Primavera",
    createdBy: MOCK_PRINCIPAL,
    ingredients: [
      { ingredientId: "ing-2", quantity: 1, unit: "cups" },
      { ingredientId: "ing-3", quantity: 3, unit: "tbsp" },
      { ingredientId: "ing-5", quantity: 2, unit: "oz" },
    ],
    instructionType: InstructionType.freetext,
    steps: [],
    freetext: "Cook pasta al dente. Sauté vegetables in olive oil. Toss together with parmesan.",
    prepTime: BigInt(10),
    cookTime: BigInt(20),
    servings: BigInt(2),
    tags: ["Vegetarian", "Italian"],
    isFavorite: false,
    notes: "",
    createdAt: BigInt(Date.now()),
    updatedAt: BigInt(Date.now()),
  },
];

const weekStart = new Date();
weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
const weekStartStr = weekStart.toISOString().split("T")[0];

const sampleMealPlan: MealPlan = {
  id: "plan-1",
  householdId: MOCK_HOUSEHOLD_ID,
  weekStart: weekStartStr,
  slots: [
    { day: Day.monday, meal: Meal.dinner, recipeId: "rec-1" },
    { day: Day.tuesday, meal: Meal.lunch, recipeId: "rec-2" },
    { day: Day.wednesday, meal: Meal.dinner, recipeId: "rec-1" },
  ],
};

const sampleCart: ShoppingCart = {
  weekStart: weekStartStr,
  householdId: MOCK_HOUSEHOLD_ID,
  items: [
    { ingredientId: "ing-1", totalQuantity: 3, unit: "lbs", category: "Meat & Poultry", checked: false, householdId: MOCK_HOUSEHOLD_ID },
    { ingredientId: "ing-2", totalQuantity: 5, unit: "cups", category: "Produce", checked: true, householdId: MOCK_HOUSEHOLD_ID },
    { ingredientId: "ing-3", totalQuantity: 7, unit: "tbsp", category: "Pantry / Dry Goods", checked: false, householdId: MOCK_HOUSEHOLD_ID },
    { ingredientId: "ing-4", totalQuantity: 6, unit: "cloves", category: "Produce", checked: false, householdId: MOCK_HOUSEHOLD_ID },
    { ingredientId: "ing-5", totalQuantity: 4, unit: "oz", category: "Dairy", checked: false, householdId: MOCK_HOUSEHOLD_ID },
  ],
};

const sampleUser: User = {
  principalId: MOCK_PRINCIPAL,
  displayName: "Admin User",
  name: "Admin User",
  email: "admin@example.com",
  role: Role.admin,
  householdId: MOCK_HOUSEHOLD_ID,
  createdAt: BigInt(Date.now()),
};

const sampleHousehold: Household = {
  id: MOCK_HOUSEHOLD_ID,
  name: "My Household",
  createdBy: MOCK_PRINCIPAL,
  createdAt: BigInt(Date.now()),
};

const sampleJoinRequests: HouseholdJoinRequest[] = [];

export const mockBackend: backendInterface = {
  addCategory: async (name) => ({ __kind__: "ok", ok: name }),
  approveJoinRequest: async () => ({ __kind__: "ok", ok: null }),
  approveUser: async () => ({ __kind__: "ok", ok: sampleUser }),
  assignRecipeToSlot: async () => ({ __kind__: "ok", ok: sampleMealPlan }),
  clearAllData: async () => ({ __kind__: "ok", ok: null }),
  clearWeek: async () => ({ __kind__: "ok", ok: "cleared" }),
  createHousehold: async (name) => ({ __kind__: "ok", ok: { ...sampleHousehold, name } }),
  createIngredient: async (name, category, defaultUnit) => ({
    __kind__: "ok",
    ok: { id: "new-ing", name, category, defaultUnit, createdAt: BigInt(Date.now()) },
  }),
  createRecipe: async (name) => ({
    __kind__: "ok",
    ok: { ...sampleRecipes[0], id: "new-rec", name },
  }),
  deleteIngredient: async () => ({ __kind__: "ok", ok: "deleted" }),
  deleteRecipe: async () => ({ __kind__: "ok", ok: "deleted" }),
  denyJoinRequest: async () => ({ __kind__: "ok", ok: null }),
  denyUser: async () => ({ __kind__: "ok", ok: null }),
  getAllTags: async () => ["High Protein", "Healthy", "Quick", "Vegetarian", "Italian"],
  getCategories: async () => [
    "Produce",
    "Dairy",
    "Meat & Poultry",
    "Seafood",
    "Pantry / Dry Goods",
    "Frozen",
    "Bakery",
    "Beverages",
    "Spices & Seasonings",
    "Condiments & Sauces",
    "Snacks",
    "Other",
  ],
  getCurrentUser: async () => ({ __kind__: "ok", ok: sampleUser }),
  getHouseholdJoinRequests: async () => ({ __kind__: "ok", ok: sampleJoinRequests }),
  getHouseholdMembers: async () => ({ __kind__: "ok", ok: [sampleUser] }),
  getHouseholds: async () => ({ __kind__: "ok", ok: [sampleHousehold] }),
  getIngredient: async (id) => sampleIngredients.find((i) => i.id === id) ?? null,
  getIngredients: async () => sampleIngredients,
  getMealPlan: async () => sampleMealPlan,
  getPendingUsers: async () => ({ __kind__: "ok", ok: [] }),
  getRecipe: async (id) => sampleRecipes.find((r) => r.id === id) ?? null,
  getRecipes: async () => sampleRecipes,
  getShoppingCart: async () => sampleCart,
  getUsers: async () => ({ __kind__: "ok", ok: [sampleUser] }),
  leaveHousehold: async () => ({ __kind__: "ok", ok: null }),
  registerOrGetUser: async () => ({ __kind__: "ok", ok: sampleUser }),
  removeHouseholdMember: async () => ({ __kind__: "ok", ok: null }),
  removeRecipeFromSlot: async () => ({ __kind__: "ok", ok: sampleMealPlan }),
  removeUser: async () => ({ __kind__: "ok", ok: null }),
  renameHousehold: async (householdId, newName) => ({ __kind__: "ok", ok: { ...sampleHousehold, id: householdId, name: newName } }),
  requestJoinHousehold: async () => ({ __kind__: "ok", ok: null }),
  toggleFavorite: async () => ({ __kind__: "ok", ok: sampleRecipes[0] }),
  transferAdminRole: async () => ({ __kind__: "ok", ok: null }),
  uncheckAllCartItems: async () => ({ __kind__: "ok", ok: "unchecked" }),
  updateProfile: async (displayName, email) => ({ __kind__: "ok", ok: { ...sampleUser, displayName, email } }),
  updateIngredient: async (id, name, category, defaultUnit) => ({
    __kind__: "ok",
    ok: { id, name, category, defaultUnit, createdAt: BigInt(Date.now()) },
  }),
  updateRecipe: async (id, name) => ({
    __kind__: "ok",
    ok: { ...sampleRecipes[0], id, name },
  }),
  updateShoppingCartItem: async () => ({ __kind__: "ok", ok: "updated" }),
};
