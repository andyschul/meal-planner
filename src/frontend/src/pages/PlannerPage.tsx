import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Home,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Day, Meal } from "../backend";
import { useAuth } from "../hooks/use-auth";
import {
  useAssignRecipe,
  useClearWeek,
  useHouseholds,
  useMealPlan,
  useRecipes,
  useRemoveRecipe,
} from "../hooks/use-backend";
import {
  addDays,
  formatDuration,
  formatPlannerDate,
  weekStart as getWeekStart,
} from "../lib/utils";
import type { Recipe, TabId } from "../types";
import { DAYS_ORDER, MEALS_ORDER } from "../types";

// ─── Day labels + date headers ──────────────────────────────────────────────

const DAY_SHORT: Record<Day, string> = {
  [Day.monday]: "Mon",
  [Day.tuesday]: "Tue",
  [Day.wednesday]: "Wed",
  [Day.thursday]: "Thu",
  [Day.friday]: "Fri",
  [Day.saturday]: "Sat",
  [Day.sunday]: "Sun",
};

const MEAL_LABELS: Record<Meal, string> = {
  [Meal.breakfast]: "Breakfast",
  [Meal.lunch]: "Lunch",
  [Meal.dinner]: "Dinner",
};

// ─── Recipe Picker Panel (inline bottom sheet, no Dialog) ────────────────────

interface RecipePickerPanelProps {
  recipes: Recipe[];
  onSelect: (recipeId: string) => void;
  onClose: () => void;
  onNavigateToRecipes: () => void;
}

function RecipePickerPanel({
  recipes,
  onSelect,
  onClose,
  onNavigateToRecipes,
}: RecipePickerPanelProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );
  const favorites = filtered.filter((r) => r.isFavorite);
  const others = filtered.filter((r) => !r.isFavorite);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background/80 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      data-ocid="recipe-picker.panel"
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl flex flex-col max-h-[85dvh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0">
          <h2 className="font-display font-bold text-lg">Pick a Recipe</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-smooth"
            data-ocid="recipe-picker.close_button"
            aria-label="Close"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="pl-9 bg-muted border-transparent"
              data-ocid="recipe-picker.search_input"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 pb-4">
          {recipes.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-12 text-center"
              data-ocid="recipe-picker.empty_state"
            >
              <CalendarDays className="size-12 text-muted-foreground/50" />
              <p className="font-medium text-foreground">No recipes yet</p>
              <p className="text-sm text-muted-foreground">
                Create some recipes first to add them to your planner.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToRecipes}
                data-ocid="recipe-picker.go-to-recipes.button"
              >
                Go to Recipes
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No recipes match your search.
            </div>
          ) : (
            <>
              {favorites.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    Favorites
                  </p>
                  <div className="flex flex-col gap-2 mb-4">
                    {favorites.map((recipe, i) => (
                      <RecipePickerRow
                        key={recipe.id}
                        recipe={recipe}
                        onSelect={onSelect}
                        index={i + 1}
                        section="fav"
                      />
                    ))}
                  </div>
                </>
              )}
              {others.length > 0 && (
                <>
                  {favorites.length > 0 && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      All Recipes
                    </p>
                  )}
                  <div className="flex flex-col gap-2">
                    {others.map((recipe, i) => (
                      <RecipePickerRow
                        key={recipe.id}
                        recipe={recipe}
                        onSelect={onSelect}
                        index={i + 1}
                        section="all"
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface RecipePickerRowProps {
  recipe: Recipe;
  onSelect: (id: string) => void;
  index: number;
  section: string;
}

function RecipePickerRow({
  recipe,
  onSelect,
  index,
  section,
}: RecipePickerRowProps) {
  const totalTime = formatDuration(recipe.prepTime, recipe.cookTime);
  return (
    <button
      type="button"
      onClick={() => onSelect(recipe.id)}
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-muted active:scale-[0.98] transition-smooth text-left w-full"
      data-ocid={`recipe-picker.${section}.item.${index}`}
    >
      {recipe.imageId ? (
        <img
          src={`/api/images/${recipe.imageId}`}
          alt={recipe.name}
          className="size-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="size-12 rounded-lg bg-border/60 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🍽️</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-snug truncate">
          {recipe.name}
        </p>
        {totalTime && (
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="size-3" />
            {totalTime}
          </p>
        )}
      </div>
      {recipe.isFavorite && (
        <Heart className="size-4 text-primary fill-primary flex-shrink-0" />
      )}
    </button>
  );
}

// ─── Inline Clear Week Confirm Panel ─────────────────────────────────────────

interface ClearWeekPanelProps {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ClearWeekPanel({
  onConfirm,
  onCancel,
  isPending,
}: ClearWeekPanelProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
      onClick={onCancel}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      data-ocid="clear-week.panel"
    >
      <div
        className="bg-card border border-border rounded-t-2xl p-6 w-full max-w-sm"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-destructive/10">
            <AlertCircle className="size-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base">
              Clear all meals?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              This will remove all meals for this week and clear the shopping
              cart.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            data-ocid="clear-week.cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
            disabled={isPending}
            data-ocid="clear-week.confirm_button"
          >
            {isPending ? "Clearing…" : "Clear Week"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Meal Cell ───────────────────────────────────────────────────────────────

interface MealCellProps {
  recipe: Recipe | undefined;
  day: Day;
  meal: Meal;
  onAdd: () => void;
  onRemove: () => void;
  onView: (recipe: Recipe) => void;
}

function MealCell({
  recipe,
  day,
  meal,
  onAdd,
  onRemove,
  onView,
}: MealCellProps) {
  const ocid = `planner.cell.${day}.${meal}`;

  if (!recipe) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="group flex items-center justify-center w-full h-full min-h-[72px] rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 active:bg-primary/10 transition-smooth"
        data-ocid={`${ocid}.add_button`}
        aria-label={`Add ${MEAL_LABELS[meal]} on ${DAY_SHORT[day]}`}
      >
        <Plus className="size-4 text-muted-foreground/50 group-hover:text-primary transition-smooth" />
      </button>
    );
  }

  return (
    <div
      className="relative w-full h-full min-h-[72px] rounded-xl bg-card border border-border overflow-hidden shadow-sm"
      data-ocid={`${ocid}.card`}
    >
      <button
        type="button"
        onClick={() => onView(recipe)}
        className="flex flex-col w-full h-full p-2 gap-1.5 text-left"
        data-ocid={`${ocid}.view_button`}
      >
        {recipe.imageId && (
          <img
            src={`/api/images/${recipe.imageId}`}
            alt={recipe.name}
            className="w-full h-10 object-cover rounded-lg"
          />
        )}
        <p className="text-[11px] font-medium leading-tight line-clamp-2 text-foreground">
          {recipe.name}
        </p>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 hover:bg-destructive/10 hover:text-destructive transition-smooth z-10"
        data-ocid={`${ocid}.delete_button`}
        aria-label="Remove recipe"
      >
        <X className="size-3 text-muted-foreground" />
      </button>
    </div>
  );
}

// ─── Recipe Detail inline panel ───────────────────────────────────────────────

interface RecipeDetailPanelProps {
  recipe: Recipe;
  onClose: () => void;
}

function RecipeDetailPanel({ recipe, onClose }: RecipeDetailPanelProps) {
  const totalTime = formatDuration(recipe.prepTime, recipe.cookTime);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-background/80 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      data-ocid="recipe-detail.panel"
    >
      <div
        className="bg-card border-t border-border rounded-t-2xl flex flex-col max-h-[80dvh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="overflow-y-auto flex-1 px-4 pb-4">
          {recipe.imageId && (
            <img
              src={`/api/images/${recipe.imageId}`}
              alt={recipe.name}
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
          )}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="font-display font-bold text-xl leading-tight flex-1 min-w-0">
              {recipe.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-smooth flex-shrink-0"
              data-ocid="recipe-detail.close_button"
            >
              <X className="size-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 flex-wrap">
            {totalTime && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {totalTime}
              </span>
            )}
            {Number(recipe.servings) > 0 && (
              <span>{Number(recipe.servings)} servings</span>
            )}
            {recipe.isFavorite && (
              <span className="flex items-center gap-1 text-primary">
                <Heart className="size-3.5 fill-primary" />
                Favorite
              </span>
            )}
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main PlannerPage ────────────────────────────────────────────────────────

interface PlannerPageProps {
  onTabChange?: (tab: TabId) => void;
  onOpenHouseholdSettings?: () => void;
}

export default function PlannerPage({
  onTabChange,
  onOpenHouseholdSettings,
}: PlannerPageProps) {
  const { currentUser } = useAuth();
  const { data: households = [] } = useHouseholds();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getWeekStart(new Date()),
  );
  const [pickerSlot, setPickerSlot] = useState<{
    day: Day;
    meal: Meal;
  } | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { data: mealPlan, isLoading: planLoading } =
    useMealPlan(currentWeekStart);
  const { data: recipes = [], isLoading: recipesLoading } = useRecipes();
  const assignRecipe = useAssignRecipe();
  const removeRecipe = useRemoveRecipe();
  const clearWeek = useClearWeek();

  // Get household name
  const household = currentUser?.householdId
    ? households.find((h) => h.id === currentUser.householdId)
    : null;

  const recipeMap = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));

  function getSlotRecipe(day: Day, meal: Meal): Recipe | undefined {
    const slot = mealPlan?.slots.find((s) => s.day === day && s.meal === meal);
    if (!slot) return undefined;
    return recipeMap.get(slot.recipeId);
  }

  function handlePrevWeek() {
    setCurrentWeekStart((ws) => addDays(ws, -7));
  }

  function handleNextWeek() {
    setCurrentWeekStart((ws) => addDays(ws, 7));
  }

  function handleToday() {
    setCurrentWeekStart(getWeekStart(new Date()));
  }

  function handleAddSlot(day: Day, meal: Meal) {
    setPickerSlot({ day, meal });
  }

  function handlePickRecipe(recipeId: string) {
    if (!pickerSlot) return;
    assignRecipe.mutate({
      weekStart: currentWeekStart,
      day: pickerSlot.day,
      meal: pickerSlot.meal,
      recipeId,
    });
    setPickerSlot(null);
  }

  function handleRemoveSlot(day: Day, meal: Meal) {
    removeRecipe.mutate({
      weekStart: currentWeekStart,
      day: day as string,
      meal: meal as string,
    });
  }

  function handleClearWeek() {
    clearWeek.mutate(currentWeekStart, {
      onSuccess: () => setShowClearConfirm(false),
    });
  }

  const hasAnySlots = (mealPlan?.slots?.length ?? 0) > 0;
  const todayWeekStart = getWeekStart(new Date());
  const isCurrentWeek = currentWeekStart === todayWeekStart;
  const weekEndDate = addDays(currentWeekStart, 6);

  // No household state
  if (!currentUser?.householdId) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-full py-20 px-6 text-center bg-background"
        data-ocid="planner.no-household.page"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <Home className="size-10 text-primary" />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-2">
          No household yet
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
          Join or create a household to start planning your meals for the week.
        </p>
        {onOpenHouseholdSettings && (
          <Button
            onClick={onOpenHouseholdSettings}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            data-ocid="planner.no-household.settings_button"
          >
            <Home className="size-4" />
            Household Settings
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full bg-background"
      data-ocid="planner.page"
    >
      {/* Week navigation header */}
      <div className="px-4 pt-4 pb-3 bg-card border-b border-border sticky top-0 z-30">
        {/* Household name */}
        {household && (
          <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1">
            <Home className="size-3" />
            {household.name}'s Meal Plan
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevWeek}
              className="size-8"
              data-ocid="planner.prev-week.button"
              aria-label="Previous week"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="text-center min-w-[120px]">
              <p className="font-display font-bold text-sm leading-tight">
                {formatPlannerDate(currentWeekStart)} –{" "}
                {formatPlannerDate(weekEndDate)}
              </p>
              {isCurrentWeek && (
                <p className="text-[10px] text-primary font-medium">
                  This week
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextWeek}
              className="size-8"
              data-ocid="planner.next-week.button"
              aria-label="Next week"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            {!isCurrentWeek && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="text-xs h-8 px-3"
                data-ocid="planner.today.button"
              >
                Today
              </Button>
            )}
            {hasAnySlots && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                data-ocid="planner.clear-week.button"
              >
                <Trash2 className="size-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Planner grid — horizontal scroll on mobile */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {planLoading || recipesLoading ? (
          <div className="p-6 flex flex-col gap-3">
            {MEALS_ORDER.map((meal) => (
              <div key={meal} className="flex gap-2">
                <div className="w-16 h-20 rounded-xl bg-muted animate-pulse flex-shrink-0" />
                {DAYS_ORDER.map((day) => (
                  <div
                    key={day}
                    className="w-20 h-20 rounded-xl bg-muted animate-pulse flex-shrink-0"
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="min-w-max px-3 py-3"
            style={{ minWidth: "calc(7 * 88px + 64px + 24px)" }}
          >
            {/* Day headers */}
            <div className="flex gap-2 mb-2 sticky top-0 z-10 bg-background/90 backdrop-blur-sm pb-2">
              <div className="w-16 flex-shrink-0" />
              {DAYS_ORDER.map((day, i) => {
                const dateStr = addDays(currentWeekStart, i);
                const today = new Date().toISOString().slice(0, 10);
                const isToday = dateStr === today;
                return (
                  <div
                    key={day}
                    className={cn(
                      "w-20 flex-shrink-0 flex flex-col items-center py-1.5 rounded-xl",
                      isToday ? "bg-primary/10" : "",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] font-semibold tracking-wide uppercase",
                        isToday ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {DAY_SHORT[day]}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] mt-0.5",
                        isToday
                          ? "text-primary font-bold"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatPlannerDate(dateStr)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Meal rows */}
            {MEALS_ORDER.map((meal) => (
              <div key={meal} className="flex gap-2 mb-2">
                <div className="w-16 flex-shrink-0 flex items-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">
                    {MEAL_LABELS[meal]}
                  </span>
                </div>
                {DAYS_ORDER.map((day) => {
                  const recipe = getSlotRecipe(day, meal);
                  return (
                    <div key={day} className="w-20 flex-shrink-0">
                      <MealCell
                        recipe={recipe}
                        day={day}
                        meal={meal}
                        onAdd={() => handleAddSlot(day, meal)}
                        onRemove={() => handleRemoveSlot(day, meal)}
                        onView={setViewingRecipe}
                      />
                    </div>
                  );
                })}
              </div>
            ))}

            {!hasAnySlots && (
              <div
                className="text-center py-6 px-4"
                data-ocid="planner.empty_state"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Plan your meals for the week!{" "}
                  <span className="text-primary">
                    Tap any slot to add a recipe.
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recipe Picker Panel */}
      {pickerSlot && (
        <RecipePickerPanel
          recipes={recipes}
          onSelect={handlePickRecipe}
          onClose={() => setPickerSlot(null)}
          onNavigateToRecipes={() => {
            setPickerSlot(null);
            onTabChange?.("recipes");
          }}
        />
      )}

      {/* Recipe Detail Panel */}
      {viewingRecipe && (
        <RecipeDetailPanel
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(null)}
        />
      )}

      {/* Clear Week Confirm Panel */}
      {showClearConfirm && (
        <ClearWeekPanel
          onConfirm={handleClearWeek}
          onCancel={() => setShowClearConfirm(false)}
          isPending={clearWeek.isPending}
        />
      )}
    </div>
  );
}
