import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAddCategory,
  useCategories,
  useCreateIngredient,
  useDeleteIngredient,
  useIngredients,
  useRecipes,
  useUpdateIngredient,
} from "../hooks/use-backend";
import type { Ingredient } from "../types";
import { UNIT_OPTIONS } from "../types";

// ─── Category color map ────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Produce:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  Dairy: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "Meat & Poultry":
    "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  Seafood: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
  "Pantry / Dry Goods":
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  Frozen: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  Bakery:
    "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  Beverages:
    "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  "Spices & Seasonings":
    "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  "Condiments & Sauces":
    "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  Snacks: "bg-pink-500/15 text-pink-700 dark:text-pink-400 border-pink-500/30",
  Other: "bg-muted text-muted-foreground border-border",
};

function getCategoryColor(category: string): string {
  return (
    CATEGORY_COLORS[category] ?? "bg-primary/15 text-primary border-primary/30"
  );
}

// ─── IngredientForm (inline, no Dialog) ───────────────────────────────────────

interface IngredientFormProps {
  ingredient?: Ingredient;
  categories: string[];
  existingNames: string[];
  onClose: () => void;
}

function IngredientForm({
  ingredient,
  categories,
  existingNames,
  onClose,
}: IngredientFormProps) {
  const isEdit = !!ingredient;
  const [name, setName] = useState(ingredient?.name ?? "");
  const [category, setCategory] = useState(ingredient?.category ?? "");
  const [defaultUnit, setDefaultUnit] = useState(
    ingredient?.defaultUnit ?? "pieces",
  );
  const [nameError, setNameError] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryError, setNewCategoryError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();
  const addCategory = useAddCategory();

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 50);
  }, []);

  const validateName = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return "Name is required.";
    const dupe = existingNames.find(
      (n) =>
        n.toLowerCase() === trimmed.toLowerCase() && n !== ingredient?.name,
    );
    if (dupe) return "An ingredient with this name already exists.";
    return "";
  };

  const handleSaveCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setNewCategoryError("Category name is required.");
      return;
    }
    try {
      await addCategory.mutateAsync(trimmed);
      setCategory(trimmed);
      setAddingCategory(false);
      setNewCategoryName("");
      setNewCategoryError("");
    } catch (e) {
      setNewCategoryError(
        e instanceof Error ? e.message : "Failed to add category.",
      );
    }
  };

  const handleSubmit = async () => {
    const err = validateName(name);
    if (err) {
      setNameError(err);
      return;
    }
    if (!category) {
      setNameError("Please select a category.");
      return;
    }

    try {
      if (isEdit) {
        await updateIngredient.mutateAsync({
          id: ingredient.id,
          name: name.trim(),
          category,
          defaultUnit,
        });
      } else {
        await createIngredient.mutateAsync({
          name: name.trim(),
          category,
          defaultUnit,
        });
      }
      onClose();
    } catch (e) {
      setNameError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const isPending = createIngredient.isPending || updateIngredient.isPending;

  return (
    <div
      className="bg-card border border-primary/20 rounded-2xl p-4 mb-4 shadow-md"
      data-ocid="ingredient.form"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base text-foreground">
          {isEdit ? "Edit Ingredient" : "Add Ingredient"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted transition-smooth text-muted-foreground hover:text-foreground"
          aria-label="Close form"
          data-ocid="ingredient.form.close_button"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="ing-name"
            className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
          >
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ing-name"
            ref={nameRef}
            data-ocid="ingredient.name.input"
            placeholder="e.g. Chicken Breast"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(validateName(e.target.value));
            }}
            onBlur={() => setNameError(validateName(name))}
            className={cn(
              "bg-secondary border-input",
              nameError && "border-destructive",
            )}
          />
          {nameError && (
            <p
              data-ocid="ingredient.name.field_error"
              className="text-destructive text-xs"
            >
              {nameError}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Category <span className="text-destructive">*</span>
          </Label>
          {addingCategory ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  data-ocid="ingredient.new-category.input"
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    setNewCategoryError("");
                  }}
                  className="bg-secondary border-input flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSaveCategory();
                    }
                    if (e.key === "Escape") setAddingCategory(false);
                  }}
                />
                <Button
                  data-ocid="ingredient.new-category.confirm_button"
                  size="sm"
                  onClick={() => void handleSaveCategory()}
                  disabled={addCategory.isPending}
                  className="shrink-0"
                >
                  Add
                </Button>
                <Button
                  data-ocid="ingredient.new-category.cancel_button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setAddingCategory(false)}
                  className="shrink-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
              {newCategoryError && (
                <p className="text-destructive text-xs">{newCategoryError}</p>
              )}
            </div>
          ) : (
            <Select
              value={category}
              onValueChange={(v) => {
                if (v === "__add_new__") {
                  setAddingCategory(true);
                } else {
                  setCategory(v);
                }
              }}
            >
              <SelectTrigger
                data-ocid="ingredient.category.select"
                className="bg-secondary border-input"
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem
                  value="__add_new__"
                  className="text-primary font-medium"
                >
                  + Add New Category
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Default Unit */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Default Unit
          </Label>
          <Select value={defaultUnit} onValueChange={setDefaultUnit}>
            <SelectTrigger
              data-ocid="ingredient.unit.select"
              className="bg-secondary border-input"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {UNIT_OPTIONS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <Button
            data-ocid="ingredient.cancel_button"
            variant="outline"
            className="flex-1 h-9 text-sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            data-ocid="ingredient.submit_button"
            className="flex-1 h-9 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => void handleSubmit()}
            disabled={isPending || !name.trim() || !category}
          >
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Ingredient"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Delete Confirm Row ────────────────────────────────────────────────

interface DeleteConfirmRowProps {
  ingredientName: string;
  affectedRecipeCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmRow({
  ingredientName,
  affectedRecipeCount,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmRowProps) {
  return (
    <div
      className="mt-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-sm"
      data-ocid="ingredient.delete.confirm_row"
    >
      <p className="text-foreground mb-1 font-medium">
        Delete &ldquo;{ingredientName}&rdquo;?
      </p>
      {affectedRecipeCount > 0 && (
        <p className="text-xs text-muted-foreground mb-2">
          Used in{" "}
          <span className="text-destructive font-semibold">
            {affectedRecipeCount} recipe{affectedRecipeCount > 1 ? "s" : ""}
          </span>
          . Will be removed from those recipes.
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-8 text-xs"
          data-ocid="ingredient.delete.cancel_button"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 h-8 text-xs"
          data-ocid="ingredient.delete.confirm_button"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}

// ─── IngredientCard ────────────────────────────────────────────────────────────

interface IngredientCardProps {
  ingredient: Ingredient;
  index: number;
  isEditing: boolean;
  deleteTarget: string | null;
  categories: string[];
  existingNames: string[];
  onEditOpen: (id: string) => void;
  onEditClose: () => void;
  onDeleteOpen: (id: string) => void;
  onDeleteClose: () => void;
  onDeleteConfirm: (id: string) => void;
  affectedRecipeCount: number;
  isDeleting: boolean;
}

function IngredientCard({
  ingredient,
  index,
  isEditing,
  deleteTarget,
  categories,
  existingNames,
  onEditOpen,
  onEditClose,
  onDeleteOpen,
  onDeleteClose,
  onDeleteConfirm,
  affectedRecipeCount,
  isDeleting,
}: IngredientCardProps) {
  const showEditForm = isEditing;
  const showDeleteConfirm = deleteTarget === ingredient.id;

  if (showEditForm) {
    return (
      <IngredientForm
        ingredient={ingredient}
        categories={categories}
        existingNames={existingNames}
        onClose={onEditClose}
      />
    );
  }

  return (
    <div data-ocid={`ingredients.item.${index}`}>
      <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-card transition-smooth hover:border-primary/40">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug truncate">
            {ingredient.name}
          </p>
          <div className="mt-1">
            <Badge
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                getCategoryColor(ingredient.category),
              )}
              variant="outline"
            >
              {ingredient.category}
            </Badge>
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          {ingredient.defaultUnit}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            data-ocid={`ingredients.edit_button.${index}`}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label={`Edit ${ingredient.name}`}
            onClick={() => onEditOpen(ingredient.id)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            data-ocid={`ingredients.delete_button.${index}`}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label={`Delete ${ingredient.name}`}
            onClick={() => onDeleteOpen(ingredient.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmRow
          ingredientName={ingredient.name}
          affectedRecipeCount={affectedRecipeCount}
          onConfirm={() => onDeleteConfirm(ingredient.id)}
          onCancel={onDeleteClose}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

// ─── IngredientsPage ───────────────────────────────────────────────────────────

export default function IngredientsPage() {
  const { data: ingredients = [], isLoading: loadingIngredients } =
    useIngredients();
  const { data: categories = [], isLoading: loadingCategories } =
    useCategories();
  const { data: recipes = [] } = useRecipes();
  const deleteIngredient = useDeleteIngredient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("__all__");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(val), 300);
  }, []);

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  const getAffectedRecipeCount = (ingredientId: string) =>
    recipes.filter((r) =>
      r.ingredients.some((ri) => ri.ingredientId === ingredientId),
    ).length;

  const filteredIngredients = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return ingredients.filter((ing) => {
      const matchesSearch = !q || ing.name.toLowerCase().includes(q);
      const matchesCat =
        categoryFilter === "__all__" || ing.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [ingredients, debouncedSearch, categoryFilter]);

  const existingNames = useMemo(
    () => ingredients.map((i) => i.name),
    [ingredients],
  );

  const isLoading = loadingIngredients || loadingCategories;

  const handleOpenAdd = () => {
    setEditingId(null);
    setDeleteTargetId(null);
    setShowAddForm(true);
  };

  const handleCloseAdd = () => setShowAddForm(false);

  const handleOpenEdit = (id: string) => {
    setShowAddForm(false);
    setDeleteTargetId(null);
    setEditingId(id);
  };

  const handleCloseEdit = () => setEditingId(null);

  const handleOpenDelete = (id: string) => {
    setEditingId(null);
    setDeleteTargetId(deleteTargetId === id ? null : id);
  };

  const handleCloseDelete = () => setDeleteTargetId(null);

  const handleConfirmDelete = async (id: string) => {
    await deleteIngredient.mutateAsync(id);
    setDeleteTargetId(null);
  };

  // Limit visible categories on mobile
  const VISIBLE_CAT_COUNT = 6;
  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, VISIBLE_CAT_COUNT);
  const hasMoreCategories = categories.length > VISIBLE_CAT_COUNT;

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 pt-4 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-xl tracking-tight">
            Ingredients
          </h1>
          <Button
            data-ocid="ingredients.add_button"
            size="sm"
            className="h-8 gap-1.5 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={showAddForm ? handleCloseAdd : handleOpenAdd}
          >
            {showAddForm ? (
              <>
                <X className="size-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Add
              </>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            data-ocid="ingredients.search_input"
            placeholder="Search ingredients…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 bg-secondary border-input h-9 text-sm"
          />
          {search && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              data-ocid="ingredients.filter.all.tab"
              onClick={() => setCategoryFilter("__all__")}
              className={cn(
                "shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-smooth",
                categoryFilter === "__all__"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-input hover:text-foreground",
              )}
            >
              All
            </button>
            {visibleCategories.map((cat) => (
              <button
                type="button"
                key={cat}
                data-ocid={`ingredients.filter.${cat.toLowerCase().replace(/[^a-z0-9]/g, "-")}.tab`}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-smooth whitespace-nowrap",
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-input hover:text-foreground",
                )}
              >
                {cat}
              </button>
            ))}
            {hasMoreCategories && (
              <button
                type="button"
                onClick={() => setShowAllCategories((s) => !s)}
                className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-input bg-secondary text-muted-foreground hover:text-foreground transition-smooth flex items-center gap-1"
              >
                {showAllCategories ? (
                  <>
                    <ChevronUp className="size-3" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3" />+
                    {categories.length - VISIBLE_CAT_COUNT}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        {/* Inline Add Form */}
        {showAddForm && (
          <IngredientForm
            categories={categories}
            existingNames={existingNames}
            onClose={handleCloseAdd}
          />
        )}

        {isLoading ? (
          <div
            data-ocid="ingredients.loading_state"
            className="flex flex-col gap-3"
          >
            {(["s1", "s2", "s3", "s4", "s5", "s6"] as const).map((k) => (
              <Skeleton key={k} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredIngredients.length === 0 ? (
          ingredients.length === 0 && !showAddForm ? (
            <div
              data-ocid="ingredients.empty_state"
              className="flex flex-col items-center justify-center gap-5 py-20 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="size-10 text-primary" />
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-display font-bold text-lg">
                  Your ingredient library is empty
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Start adding ingredients to build your recipes and generate
                  smart shopping lists.
                </p>
              </div>
              <Button
                data-ocid="ingredients.empty_state.add_button"
                size="lg"
                className="gap-2 px-6"
                onClick={handleOpenAdd}
              >
                <Plus className="size-5" />
                Add First Ingredient
              </Button>
            </div>
          ) : (
            <div
              data-ocid="ingredients.no-results.empty_state"
              className="flex flex-col items-center justify-center gap-3 py-16 text-center"
            >
              <Search className="size-10 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">
                No ingredients match your search
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSearchChange("");
                  setCategoryFilter("__all__");
                }}
              >
                Clear filters
              </Button>
            </div>
          )
        ) : (
          <div data-ocid="ingredients.list" className="flex flex-col gap-2.5">
            {filteredIngredients.map((ing, idx) => (
              <IngredientCard
                key={ing.id}
                ingredient={ing}
                index={idx + 1}
                isEditing={editingId === ing.id}
                deleteTarget={deleteTargetId}
                categories={categories}
                existingNames={existingNames}
                onEditOpen={handleOpenEdit}
                onEditClose={handleCloseEdit}
                onDeleteOpen={handleOpenDelete}
                onDeleteClose={handleCloseDelete}
                onDeleteConfirm={(id) => void handleConfirmDelete(id)}
                affectedRecipeCount={getAffectedRecipeCount(ing.id)}
                isDeleting={deleteIngredient.isPending}
              />
            ))}
            <p className="text-center text-xs text-muted-foreground pt-2 pb-1">
              {filteredIngredients.length} ingredient
              {filteredIngredients.length !== 1 ? "s" : ""}
              {categoryFilter !== "__all__" || debouncedSearch
                ? " found"
                : " total"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
