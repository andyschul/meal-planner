import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Edit2,
  Heart,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { InstructionType } from "../backend";
import {
  useDeleteRecipe,
  useIngredients,
  useMealPlan,
  useRecipe,
  useToggleFavorite,
} from "../hooks/use-backend";
import { formatDuration } from "../lib/utils";
import { weekStart } from "../lib/utils";
import type { Recipe } from "../types";

interface RecipeDetailProps {
  recipeId: string;
  onBack: () => void;
  onEdit: (recipe: Recipe) => void;
}

export function RecipeDetail({ recipeId, onBack, onEdit }: RecipeDetailProps) {
  const { data: recipe, isLoading } = useRecipe(recipeId);
  const { data: ingredients = [] } = useIngredients();
  const { data: mealPlan } = useMealPlan(weekStart());
  const toggleFav = useToggleFavorite();
  const deleteRecipe = useDeleteRecipe();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOnPlan =
    mealPlan?.slots.some((s) => s.recipeId === recipeId) ?? false;

  const handleDelete = async () => {
    await deleteRecipe.mutateAsync(recipeId);
    onBack();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Recipe not found.
      </div>
    );
  }

  const getIngredientName = (id: string) =>
    ingredients.find((i) => i.id === id)?.name ?? "Unknown ingredient";

  const totalTime = formatDuration(recipe.prepTime, recipe.cookTime);

  return (
    <div
      className="flex flex-col bg-background min-h-full"
      data-ocid="recipe_detail.page"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-ocid="recipe_detail.back_button"
          onClick={onBack}
          className="shrink-0 -ml-1"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="font-display font-bold text-base line-clamp-1 flex-1 min-w-0">
          {recipe.name}
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-ocid="recipe_detail.favorite_button"
          onClick={() => toggleFav.mutate(recipe.id)}
          aria-label={
            recipe.isFavorite ? "Remove from favorites" : "Add to favorites"
          }
        >
          <Heart
            className={cn(
              "size-5 transition-smooth",
              recipe.isFavorite
                ? "fill-primary text-primary"
                : "text-muted-foreground",
            )}
          />
        </Button>
      </div>

      {/* Hero image */}
      <div className="w-full aspect-[16/9] bg-muted overflow-hidden">
        {recipe.imageId ? (
          <img
            src={recipe.imageId}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
            <span className="text-7xl opacity-25">🍽️</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 p-4">
        {/* Title + meta */}
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground leading-tight">
            {recipe.name}
          </h2>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {totalTime && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4 text-primary" />
                {totalTime}
              </span>
            )}
            {Number(recipe.prepTime) > 0 && (
              <span className="text-xs text-muted-foreground">
                Prep: {String(recipe.prepTime)}m
              </span>
            )}
            {Number(recipe.cookTime) > 0 && (
              <span className="text-xs text-muted-foreground">
                Cook: {String(recipe.cookTime)}m
              </span>
            )}
            {Number(recipe.servings) > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="size-4 text-primary" />
                {String(recipe.servings)} servings
              </span>
            )}
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <div>
            <h3 className="font-display font-bold text-base mb-3">
              Ingredients
            </h3>
            <div className="flex flex-col gap-2">
              {recipe.ingredients.map((ri) => (
                <div
                  key={`${ri.ingredientId}-${ri.unit}`}
                  className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                >
                  <span className="text-sm text-foreground">
                    {getIngredientName(ri.ingredientId)}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {ri.quantity} {ri.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {(recipe.steps.length > 0 || recipe.freetext) && (
          <>
            <Separator />
            <div>
              <h3 className="font-display font-bold text-base mb-3">
                Instructions
              </h3>
              {recipe.instructionType === InstructionType.steps ? (
                <ol className="flex flex-col gap-3">
                  {recipe.steps.filter(Boolean).map((step, stepIdx) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <li
                      key={`step-${stepIdx}-${step.length}`}
                      className="flex gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {stepIdx + 1}
                      </span>
                      <p className="text-sm text-foreground leading-relaxed flex-1">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {recipe.freetext}
                </p>
              )}
            </div>
          </>
        )}

        {/* Notes */}
        {recipe.notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-display font-bold text-base mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {recipe.notes}
              </p>
            </div>
          </>
        )}

        {/* Actions */}
        <Separator />
        <div className="flex gap-3 pb-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="recipe_detail.edit_button"
            onClick={() => onEdit(recipe)}
            className="flex-1 gap-2"
          >
            <Edit2 className="size-4" />
            Edit Recipe
          </Button>
          <Button
            type="button"
            variant="destructive"
            data-ocid="recipe_detail.delete_button"
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-2"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          data-ocid="recipe_detail.dialog"
        >
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-elevated border border-border">
            {isOnPlan && (
              <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive leading-relaxed">
                  This recipe is on your current meal plan. Removing it will
                  also remove it from the planner and update the shopping cart.
                </p>
              </div>
            )}
            <h3 className="font-display font-bold text-lg mb-2">
              Delete recipe?
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              "{recipe.name}" will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                data-ocid="recipe_detail.cancel_button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                data-ocid="recipe_detail.confirm_button"
                onClick={handleDelete}
                disabled={deleteRecipe.isPending}
                className="flex-1"
              >
                {deleteRecipe.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
