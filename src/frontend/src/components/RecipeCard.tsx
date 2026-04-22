import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Heart, Users } from "lucide-react";
import { formatDuration } from "../lib/utils";
import type { Recipe } from "../types";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  index: number;
}

export function RecipeCard({
  recipe,
  onClick,
  onToggleFavorite,
  index,
}: RecipeCardProps) {
  const totalTime = formatDuration(recipe.prepTime, recipe.cookTime);

  return (
    <div
      data-ocid={`recipes.item.${index}`}
      className="bg-card rounded-2xl overflow-hidden border border-border shadow-card transition-smooth hover:shadow-elevated flex flex-col relative"
    >
      {/* Image area with tap to view */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`View ${recipe.name}`}
        className="relative w-full aspect-[4/3] overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {recipe.imageId ? (
          <img
            src={recipe.imageId}
            alt={recipe.name}
            className="w-full h-full object-cover transition-smooth hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
            <span className="text-5xl opacity-30">🍽️</span>
          </div>
        )}
      </button>

      {/* Content */}
      <button
        type="button"
        onClick={onClick}
        className="p-3 flex flex-col gap-1 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring w-full"
      >
        <h3 className="font-display font-bold text-sm leading-snug line-clamp-2 text-foreground">
          {recipe.name}
        </h3>
        <div className="flex items-center gap-2 mt-auto pt-1">
          {totalTime && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {totalTime}
            </span>
          )}
          {Number(recipe.servings) > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" />
              {String(recipe.servings)}
            </span>
          )}
          {recipe.tags.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 ml-auto shrink-0"
            >
              {recipe.tags[0]}
            </Badge>
          )}
        </div>
      </button>

      {/* Favorite toggle — positioned over image */}
      <button
        type="button"
        data-ocid={`recipes.favorite.${index}`}
        aria-label={
          recipe.isFavorite ? "Remove from favorites" : "Add to favorites"
        }
        onClick={onToggleFavorite}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-background/75 backdrop-blur-sm transition-smooth hover:scale-110 active:scale-95 z-10"
      >
        <Heart
          className={cn(
            "size-3.5 transition-smooth",
            recipe.isFavorite
              ? "fill-primary text-primary"
              : "text-muted-foreground",
          )}
        />
      </button>
    </div>
  );
}
