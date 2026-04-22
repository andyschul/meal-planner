import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import { weekStart } from "../lib/utils";
import type {
  AppUser,
  Household,
  HouseholdJoinRequest,
  Ingredient,
  MealPlan,
  Recipe,
  RecipeIngredient,
  ShoppingCart,
} from "../types";

// ─── Actor helper ───────────────────────────────────────────────────────────────

function useBackendActor() {
  return useActor(createActor);
}

// ─── User / Auth mapping ────────────────────────────────────────────────────────

function mapUser(raw: {
  principalId: { toText: () => string } | string;
  displayName: string;
  householdId?: string;
  role: string;
  createdAt: bigint;
  name: string;
  email: string;
}): AppUser {
  const principalId =
    typeof raw.principalId === "string"
      ? raw.principalId
      : raw.principalId.toText();
  return {
    principalId,
    displayName: raw.displayName,
    householdId: raw.householdId ?? null,
    role: raw.role as AppUser["role"],
    createdAt: raw.createdAt,
    name: raw.name,
    email: raw.email,
  };
}

function mapHousehold(raw: {
  id: string;
  name: string;
  createdBy: { toText: () => string } | string;
  createdAt: bigint;
}): Household {
  return {
    id: raw.id,
    name: raw.name,
    createdBy:
      typeof raw.createdBy === "string"
        ? raw.createdBy
        : raw.createdBy.toText(),
    createdAt: raw.createdAt,
  };
}

function mapJoinRequest(raw: {
  id: string;
  householdId: string;
  requesterId: { toText: () => string } | string;
  requesterName: string;
  createdAt: bigint;
}): HouseholdJoinRequest {
  return {
    id: raw.id,
    householdId: raw.householdId,
    requesterId:
      typeof raw.requesterId === "string"
        ? raw.requesterId
        : raw.requesterId.toText(),
    requesterName: raw.requesterName,
    createdAt: raw.createdAt,
  };
}

// ─── Current User ───────────────────────────────────────────────────────────────

export function useCurrentUser() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<AppUser | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!actor) return null;
      const res = await actor.getCurrentUser();
      if (res.__kind__ === "err") return null;
      return mapUser(res.ok as Parameters<typeof mapUser>[0]);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Pending Users ──────────────────────────────────────────────────────────────

export function usePendingUsers() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<AppUser[]>({
    queryKey: ["pendingUsers"],
    queryFn: async () => {
      if (!actor) return [];
      const res = await actor.getPendingUsers();
      if (res.__kind__ === "err") return [];
      return (res.ok as Parameters<typeof mapUser>[0][]).map(mapUser);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── All Users (admin only) ────────────────────────────────────────────────────

export function useGetUsers() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<AppUser[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      const res = await actor.getUsers();
      if (res.__kind__ === "err") return [];
      return (res.ok as Parameters<typeof mapUser>[0][]).map(mapUser);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Approve/Deny/Remove Users ─────────────────────────────────────────────────

export function useApproveUser() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      const res = await actor.approveUser(Principal.fromText(principalId));
      if (res.__kind__ === "err") throw new Error(res.err);
      return mapUser(res.ok as Parameters<typeof mapUser>[0]);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pendingUsers"] });
      void qc.invalidateQueries({ queryKey: ["allUsers"] });
      void qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useDenyUser() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      const res = await actor.denyUser(Principal.fromText(principalId));
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pendingUsers"] });
      void qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useRemoveUser() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      const res = await actor.removeUser(Principal.fromText(principalId));
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useTransferAdminRole() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      const res = await actor.transferAdminRole(
        Principal.fromText(principalId),
      );
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["allUsers"] });
      void qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useClearAllData() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const res = await actor.clearAllData();
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries();
    },
  });
}

// ─── Households ────────────────────────────────────────────────────────────────

export function useHouseholds() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Household[]>({
    queryKey: ["households"],
    queryFn: async () => {
      if (!actor) return [];
      const res = await actor.getHouseholds();
      if (res.__kind__ === "err") return [];
      return (res.ok as Parameters<typeof mapHousehold>[0][]).map(mapHousehold);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateHousehold() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.createHousehold(name);
      if (res.__kind__ === "err") throw new Error(res.err);
      return mapHousehold(res.ok as Parameters<typeof mapHousehold>[0]);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["households"] });
      void qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useRequestJoinHousehold() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (householdId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.requestJoinHousehold(householdId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["households"] });
    },
  });
}

export function useHouseholdJoinRequests() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<HouseholdJoinRequest[]>({
    queryKey: ["householdJoinRequests"],
    queryFn: async () => {
      if (!actor) return [];
      const res = await actor.getHouseholdJoinRequests();
      if (res.__kind__ === "err") return [];
      return (res.ok as Parameters<typeof mapJoinRequest>[0][]).map(
        mapJoinRequest,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApproveJoinRequest() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.approveJoinRequest(requestId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["householdJoinRequests"] });
      void qc.invalidateQueries({ queryKey: ["householdMembers"] });
    },
  });
}

export function useDenyJoinRequest() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.denyJoinRequest(requestId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["householdJoinRequests"] });
    },
  });
}

export function useRenameHousehold() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { householdId: string; newName: string }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.renameHousehold(vars.householdId, vars.newName);
      if (res.__kind__ === "err") throw new Error(res.err);
      return mapHousehold(res.ok as Parameters<typeof mapHousehold>[0]);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["households"] });
      void qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useLeaveHousehold() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const res = await actor.leaveHousehold();
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["households"] });
      void qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useHouseholdMembers(householdId: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<AppUser[]>({
    queryKey: ["householdMembers", householdId],
    queryFn: async () => {
      if (!actor || !householdId) return [];
      const res = await actor.getHouseholdMembers(householdId);
      if (res.__kind__ === "err") return [];
      return (res.ok as Parameters<typeof mapUser>[0][]).map(mapUser);
    },
    enabled: !!actor && !isFetching && !!householdId,
  });
}

export function useRemoveHouseholdMember() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      const res = await actor.removeHouseholdMember(
        Principal.fromText(principalId),
      );
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["householdMembers"] });
    },
  });
}

// ─── Profile ───────────────────────────────────────────────────────────────────

export function useUpdateProfile() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { displayName: string; email: string }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.updateProfile(vars.displayName, vars.email);
      if (res.__kind__ === "err") throw new Error(res.err);
      return mapUser(res.ok as Parameters<typeof mapUser>[0]);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

// ─── Ingredients ───────────────────────────────────────────────────────────────

export function useIngredients() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Ingredient[]>({
    queryKey: ["ingredients"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIngredients() as Promise<Ingredient[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateIngredient() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      name: string;
      category: string;
      defaultUnit: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.createIngredient(
        vars.name,
        vars.category,
        vars.defaultUnit,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}

export function useUpdateIngredient() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      name: string;
      category: string;
      defaultUnit: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.updateIngredient(
        vars.id,
        vars.name,
        vars.category,
        vars.defaultUnit,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}

export function useDeleteIngredient() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.deleteIngredient(id);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ingredients"] });
      void qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

// ─── Categories ────────────────────────────────────────────────────────────────

export function useCategories() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCategory() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.addCategory(name);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// ─── Recipes ───────────────────────────────────────────────────────────────────

export function useRecipes() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Recipe[]>({
    queryKey: ["recipes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecipes() as Promise<Recipe[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecipe(id: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Recipe | null>({
    queryKey: ["recipe", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRecipe(id) as Promise<Recipe | null>;
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useTags() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<string[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTags();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRecipe() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      name: string;
      ingredients: RecipeIngredient[];
      instructionType: string;
      steps: string[];
      freetext: string;
      prepTime: bigint;
      cookTime: bigint;
      servings: bigint;
      tags: string[];
      imageId: string | null;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.createRecipe(
        vars.name,
        vars.ingredients,
        vars.instructionType,
        vars.steps,
        vars.freetext,
        vars.prepTime,
        vars.cookTime,
        vars.servings,
        vars.tags,
        vars.imageId,
        vars.notes,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recipes"] });
      void qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useUpdateRecipe() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      name: string;
      ingredients: RecipeIngredient[];
      instructionType: string;
      steps: string[];
      freetext: string;
      prepTime: bigint;
      cookTime: bigint;
      servings: bigint;
      tags: string[];
      imageId: string | null;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.updateRecipe(
        vars.id,
        vars.name,
        vars.ingredients,
        vars.instructionType,
        vars.steps,
        vars.freetext,
        vars.prepTime,
        vars.cookTime,
        vars.servings,
        vars.tags,
        vars.imageId,
        vars.notes,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["recipes"] });
      void qc.invalidateQueries({ queryKey: ["recipe", vars.id] });
      void qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteRecipe() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.deleteRecipe(id);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recipes"] });
      void qc.invalidateQueries({ queryKey: ["mealPlan"] });
      void qc.invalidateQueries({ queryKey: ["shoppingCart"] });
    },
  });
}

export function useToggleFavorite() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.toggleFavorite(id);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

// ─── Meal Plan ─────────────────────────────────────────────────────────────────

export function useMealPlan(week?: string) {
  const { actor, isFetching } = useBackendActor();
  const ws = week ?? weekStart();
  return useQuery<MealPlan | null>({
    queryKey: ["mealPlan", ws],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMealPlan(ws) as Promise<MealPlan | null>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignRecipe() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      weekStart: string;
      day: string;
      meal: string;
      recipeId: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.assignRecipeToSlot(
        vars.weekStart,
        vars.day,
        vars.meal,
        vars.recipeId,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["mealPlan", vars.weekStart] });
      void qc.invalidateQueries({ queryKey: ["shoppingCart", vars.weekStart] });
    },
  });
}

export function useRemoveRecipe() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      weekStart: string;
      day: string;
      meal: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.removeRecipeFromSlot(
        vars.weekStart,
        vars.day,
        vars.meal,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["mealPlan", vars.weekStart] });
      void qc.invalidateQueries({ queryKey: ["shoppingCart", vars.weekStart] });
    },
  });
}

export function useClearWeek() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ws: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.clearWeek(ws);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: (_, ws) => {
      void qc.invalidateQueries({ queryKey: ["mealPlan", ws] });
      void qc.invalidateQueries({ queryKey: ["shoppingCart", ws] });
    },
  });
}

// ─── Shopping Cart ─────────────────────────────────────────────────────────────

export function useShoppingCart(week?: string) {
  const { actor, isFetching } = useBackendActor();
  const ws = week ?? weekStart();
  return useQuery<ShoppingCart>({
    queryKey: ["shoppingCart", ws],
    queryFn: async () => {
      if (!actor) return { weekStart: ws, householdId: "", items: [] };
      return actor.getShoppingCart(ws) as Promise<ShoppingCart>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateCartItem() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      weekStart: string;
      ingredientId: string;
      unit: string;
      checked: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.updateShoppingCartItem(
        vars.weekStart,
        vars.ingredientId,
        vars.unit,
        vars.checked,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["shoppingCart", vars.weekStart] });
    },
  });
}

export function useUncheckAll() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ws: string) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.uncheckAllCartItems(ws);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: (_, ws) => {
      void qc.invalidateQueries({ queryKey: ["shoppingCart", ws] });
    },
  });
}
