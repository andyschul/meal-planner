import { Day, type InstructionType, Meal } from "./backend";

export type { Day, InstructionType, Meal };

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  createdAt: bigint;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  instructionType: InstructionType;
  steps: string[];
  freetext: string;
  prepTime: bigint;
  cookTime: bigint;
  servings: bigint;
  tags: string[];
  imageId?: string;
  notes: string;
  isFavorite: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  createdBy?: { toText: () => string } | string;
}

export interface MealSlot {
  day: Day;
  meal: Meal;
  recipeId: string;
}

export interface MealPlan {
  id: string;
  weekStart: string;
  householdId: string;
  slots: MealSlot[];
}

export interface ShoppingCartItem {
  ingredientId: string;
  totalQuantity: number;
  unit: string;
  category: string;
  checked: boolean;
  householdId: string;
}

export interface ShoppingCart {
  weekStart: string;
  householdId: string;
  items: ShoppingCartItem[];
}

export type UserRole = "admin" | "member" | "pending";

export interface AppUser {
  principalId: string;
  displayName: string;
  householdId: string | null;
  role: UserRole;
  createdAt: bigint;
  name: string;
  email: string;
}

export interface Household {
  id: string;
  name: string;
  createdBy: string;
  createdAt: bigint;
}

export interface HouseholdJoinRequest {
  id: string;
  householdId: string;
  requesterId: string;
  requesterName: string;
  createdAt: bigint;
}

export type TabId = "recipes" | "planner" | "cart" | "ingredients";

export const TABS = [
  { id: "recipes" as TabId, label: "Recipes" },
  { id: "planner" as TabId, label: "Planner" },
  { id: "cart" as TabId, label: "Shopping Cart" },
  { id: "ingredients" as TabId, label: "Ingredients" },
] as const;

export const PRESET_CATEGORIES = [
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
] as const;

export const UNIT_OPTIONS = [
  "pieces",
  "lbs",
  "oz",
  "g",
  "kg",
  "cups",
  "tbsp",
  "tsp",
  "ml",
  "L",
  "gallons",
  "bunch",
  "cloves",
  "cans",
  "bottles",
  "packages",
] as const;

export const DAYS_ORDER: Day[] = [
  Day.monday,
  Day.tuesday,
  Day.wednesday,
  Day.thursday,
  Day.friday,
  Day.saturday,
  Day.sunday,
];

export const MEALS_ORDER: Meal[] = [Meal.breakfast, Meal.lunch, Meal.dinner];
