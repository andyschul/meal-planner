import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Heart, Plus, Search, UtensilsCrossed } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { RecipeCard } from "../components/RecipeCard";
import { RecipeDetail } from "../components/RecipeDetail";
import { RecipeForm } from "../components/RecipeForm";
import {
  useGetUsers,
  useIngredients,
  useRecipes,
  useToggleFavorite,
} from "../hooks/use-backend";
import type { Recipe } from "../types";

type SortOption = "name" | "newest" | "preptime";
type View = "list" | "detail" | "form";

function getCreatorName(
  createdBy: { toText: () => string } | string | undefined,
  userMap: Map<string, string>,
): string {
  if (!createdBy) return "Unknown";
  const id = typeof createdBy === "string" ? createdBy : createdBy.toText();
  return userMap.get(id) || "Unknown";
}

export default function RecipesPage() {
  const { data: recipes = [], isLoading } = useRecipes();
  const { data: ingredients = [] } = useIngredients();
  const { data: allUsers = [] } = useGetUsers();
  const toggleFav = useToggleFavorite();

  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const deferredSearch = useDeferredValue(search);

  // Build principalId → displayName lookup
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of allUsers) {
      if (u.displayName) map.set(u.principalId, u.displayName);
      else if (u.name) map.set(u.principalId, u.name);
    }
    return map;
  }, [allUsers]);

  // Build ingredient id → name lookup for search
  const ingredientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ing of ingredients) {
      map.set(ing.id, ing.name.toLowerCase());
    }
    return map;
  }, [ingredients]);

  // Collect all unique tags
  const allTags = Array.from(new Set(recipes.flatMap((r) => r.tags)));

  const filteredRecipes = recipes
    .filter((r) => {
      if (filterFavorites && !r.isFavorite) return false;
      if (filterTags.length > 0 && !filterTags.every((t) => r.tags.includes(t)))
        return false;
      if (deferredSearch) {
        const q = deferredSearch.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesIngredient = r.ingredients.some((ri) =>
          ingredientNameMap.get(ri.ingredientId)?.includes(q),
        );
        return matchesName || matchesIngredient;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "preptime") return Number(a.prepTime) - Number(b.prepTime);
      // newest first
      return Number(b.createdAt) - Number(a.createdAt);
    });

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      toggleFav.mutate(id);
    },
    [toggleFav],
  );

  const toggleTag = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleAddRecipe = () => {
    setEditingRecipe(undefined);
    setView("form");
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setView("form");
  };

  const handleFormSave = () => {
    setView("list");
    setEditingRecipe(undefined);
  };

  const handleFormCancel = () => {
    if (editingRecipe) {
      setView("detail");
    } else {
      setView("list");
    }
    setEditingRecipe(undefined);
  };

  // Recipe detail view
  if (view === "detail" && selectedId) {
    return (
      <RecipeDetail
        recipeId={selectedId}
        onBack={() => {
          setView("list");
          setSelectedId(null);
        }}
        onEdit={handleEditRecipe}
      />
    );
  }

  // Recipe form view
  if (view === "form") {
    return (
      <RecipeForm
        recipe={editingRecipe}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
      />
    );
  }

  // List view
  return (
    <div
      className="flex flex-col bg-background min-h-full"
      data-ocid="recipes.page"
    >
      {/* Page header */}
      <div className="px-4 pt-4 pb-3 bg-background">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display font-bold text-2xl text-foreground">
            Recipes
          </h1>
          <Button
            type="button"
            data-ocid="recipes.add_button"
            onClick={handleAddRecipe}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 h-9"
          >
            <Plus className="size-4" />
            Add Recipe
          </Button>
        </div>

        {/* Search + Sort row */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              data-ocid="recipes.search_input"
              placeholder="Search recipes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger
              data-ocid="recipes.sort_select"
              className="w-32 bg-card shrink-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="name">A → Z</SelectItem>
              <SelectItem value="preptime">Prep time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            data-ocid="recipes.favorites_toggle"
            onClick={() => setFilterFavorites((f) => !f)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-smooth shrink-0",
              filterFavorites
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/50",
            )}
          >
            <Heart
              className={cn("size-3", filterFavorites && "fill-current")}
            />
            Favorites
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              data-ocid={`recipes.tag_filter.${tag.toLowerCase().replace(/\s+/g, "_")}`}
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-smooth shrink-0",
                filterTags.includes(tag)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/50",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }, (_, i) => `skel-${i}`).map((key) => (
              <div key={key} className="flex flex-col gap-2">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <EmptyState onAdd={handleAddRecipe} />
        ) : filteredRecipes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3 text-center"
            data-ocid="recipes.empty_state"
          >
            <UtensilsCrossed className="size-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              No recipes match your filters
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilterTags([]);
                setFilterFavorites(false);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            {filterTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {filterTags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 text-xs">
                    {t}
                    <button
                      type="button"
                      onClick={() => toggleTag(t)}
                      aria-label={`Remove ${t} filter`}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredRecipes.map((recipe, idx) => (
                <div key={recipe.id} className="flex flex-col">
                  <RecipeCard
                    recipe={recipe}
                    index={idx + 1}
                    onClick={() => {
                      setSelectedId(recipe.id);
                      setView("detail");
                    }}
                    onToggleFavorite={(e) => handleToggleFavorite(e, recipe.id)}
                  />
                  {/* Created by label */}
                  <p className="text-[10px] text-muted-foreground/70 px-1 pt-0.5 truncate">
                    By {getCreatorName(recipe.createdBy, userMap)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center"
      data-ocid="recipes.empty_state"
    >
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <UtensilsCrossed className="size-10 text-primary" />
      </div>
      <div>
        <h2 className="font-display font-bold text-xl text-foreground mb-1">
          No recipes yet
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Add your first recipe to start planning delicious meals for the week.
        </p>
      </div>
      <Button
        type="button"
        data-ocid="recipes.empty_add_button"
        onClick={onAdd}
        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 mt-1"
      >
        <Plus className="size-4" />
        Add your first recipe
      </Button>
    </div>
  );
}
