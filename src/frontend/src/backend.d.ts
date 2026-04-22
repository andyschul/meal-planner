import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ShoppingCart {
    householdId: string;
    items: Array<ShoppingCartItem>;
    weekStart: string;
}
export type Result_2 = {
    __kind__: "ok";
    ok: Ingredient;
} | {
    __kind__: "err";
    err: string;
};
export type Result_6 = {
    __kind__: "ok";
    ok: MealPlan;
} | {
    __kind__: "err";
    err: string;
};
export interface User {
    householdId?: string;
    displayName: string;
    name: string;
    createdAt: bigint;
    role: Role;
    email: string;
    principalId: Principal;
}
export interface MealSlot {
    day: Day;
    recipeId: string;
    meal: Meal;
}
export type Result_5 = {
    __kind__: "ok";
    ok: Household;
} | {
    __kind__: "err";
    err: string;
};
export type Result_9 = {
    __kind__: "ok";
    ok: Array<HouseholdJoinRequest>;
} | {
    __kind__: "err";
    err: string;
};
export type Result_1 = {
    __kind__: "ok";
    ok: Recipe;
} | {
    __kind__: "err";
    err: string;
};
export interface ShoppingCartItem {
    householdId: string;
    checked: boolean;
    unit: string;
    category: string;
    ingredientId: string;
    totalQuantity: number;
}
export type Result_4 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface RecipeIngredient {
    unit: string;
    quantity: number;
    ingredientId: string;
}
export type Result = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export type Result_3 = {
    __kind__: "ok";
    ok: User;
} | {
    __kind__: "err";
    err: string;
};
export interface MealPlan {
    id: string;
    householdId: string;
    slots: Array<MealSlot>;
    weekStart: string;
}
export type Result_8 = {
    __kind__: "ok";
    ok: Array<Household>;
} | {
    __kind__: "err";
    err: string;
};
export interface Ingredient {
    id: string;
    defaultUnit: string;
    name: string;
    createdAt: bigint;
    category: string;
}
export type Result_7 = {
    __kind__: "ok";
    ok: Array<User>;
} | {
    __kind__: "err";
    err: string;
};
export interface HouseholdJoinRequest {
    id: string;
    householdId: string;
    createdAt: bigint;
    requesterName: string;
    requesterId: Principal;
}
export interface Recipe {
    id: string;
    freetext: string;
    name: string;
    createdAt: bigint;
    createdBy: Principal;
    tags: Array<string>;
    cookTime: bigint;
    isFavorite: boolean;
    updatedAt: bigint;
    steps: Array<string>;
    notes: string;
    prepTime: bigint;
    instructionType: InstructionType;
    imageId?: string;
    servings: bigint;
    ingredients: Array<RecipeIngredient>;
}
export interface Household {
    id: string;
    name: string;
    createdAt: bigint;
    createdBy: Principal;
}
export enum Day {
    tuesday = "tuesday",
    wednesday = "wednesday",
    saturday = "saturday",
    thursday = "thursday",
    sunday = "sunday",
    friday = "friday",
    monday = "monday"
}
export enum InstructionType {
    freetext = "freetext",
    steps = "steps"
}
export enum Meal {
    breakfast = "breakfast",
    lunch = "lunch",
    dinner = "dinner"
}
export enum Role {
    member = "member",
    admin = "admin",
    pending = "pending"
}
export interface backendInterface {
    addCategory(name: string): Promise<Result>;
    approveJoinRequest(requestId: string): Promise<Result_4>;
    approveUser(userId: Principal): Promise<Result_3>;
    assignRecipeToSlot(weekStart: string, day: string, meal: string, recipeId: string): Promise<Result_6>;
    clearAllData(): Promise<Result_4>;
    clearWeek(weekStart: string): Promise<Result>;
    createHousehold(name: string): Promise<Result_5>;
    createIngredient(name: string, category: string, defaultUnit: string): Promise<Result_2>;
    createRecipe(name: string, recipeIngredients: Array<RecipeIngredient>, instructionType: string, steps: Array<string>, freetext: string, prepTime: bigint, cookTime: bigint, servings: bigint, tags: Array<string>, imageId: string | null, notes: string): Promise<Result_1>;
    deleteIngredient(id: string): Promise<Result>;
    deleteRecipe(id: string): Promise<Result>;
    denyJoinRequest(requestId: string): Promise<Result_4>;
    denyUser(userId: Principal): Promise<Result_4>;
    getAllTags(): Promise<Array<string>>;
    getCategories(): Promise<Array<string>>;
    getCurrentUser(): Promise<Result_3>;
    getHouseholdJoinRequests(): Promise<Result_9>;
    getHouseholdMembers(householdId: string): Promise<Result_7>;
    getHouseholds(): Promise<Result_8>;
    getIngredient(id: string): Promise<Ingredient | null>;
    getIngredients(): Promise<Array<Ingredient>>;
    getMealPlan(weekStart: string): Promise<MealPlan | null>;
    getPendingUsers(): Promise<Result_7>;
    getRecipe(id: string): Promise<Recipe | null>;
    getRecipes(): Promise<Array<Recipe>>;
    getShoppingCart(weekStart: string): Promise<ShoppingCart>;
    getUsers(): Promise<Result_7>;
    leaveHousehold(): Promise<Result_4>;
    registerOrGetUser(name: string, email: string): Promise<Result_3>;
    removeHouseholdMember(userId: Principal): Promise<Result_4>;
    removeRecipeFromSlot(weekStart: string, day: string, meal: string): Promise<Result_6>;
    removeUser(userId: Principal): Promise<Result_4>;
    renameHousehold(householdId: string, newName: string): Promise<Result_5>;
    requestJoinHousehold(householdId: string): Promise<Result_4>;
    toggleFavorite(id: string): Promise<Result_1>;
    transferAdminRole(newAdminId: Principal): Promise<Result_4>;
    uncheckAllCartItems(weekStart: string): Promise<Result>;
    updateDisplayName(displayName: string): Promise<Result_3>;
    updateIngredient(id: string, name: string, category: string, defaultUnit: string): Promise<Result_2>;
    updateRecipe(id: string, name: string, recipeIngredients: Array<RecipeIngredient>, instructionType: string, steps: Array<string>, freetext: string, prepTime: bigint, cookTime: bigint, servings: bigint, tags: Array<string>, imageId: string | null, notes: string): Promise<Result_1>;
    updateShoppingCartItem(weekStart: string, ingredientId: string, unit: string, checked: boolean): Promise<Result>;
}
