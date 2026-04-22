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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Camera,
  GripVertical,
  List,
  Plus,
  Text,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { InstructionType } from "../backend";
import {
  useCreateRecipe,
  useIngredients,
  useTags,
  useUpdateRecipe,
} from "../hooks/use-backend";
import type { Recipe, RecipeIngredient } from "../types";
import { UNIT_OPTIONS } from "../types";
import { IngredientPicker } from "./IngredientPicker";

interface RecipeFormProps {
  recipe?: Recipe;
  onSave: () => void;
  onCancel: () => void;
  onGoToIngredients?: () => void;
}

interface FormIngredient extends RecipeIngredient {
  _key: string;
}

function resizeImage(file: File, maxWidth = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function RecipeForm({
  recipe,
  onSave,
  onCancel,
  onGoToIngredients,
}: RecipeFormProps) {
  const { data: allTags = [] } = useTags();
  const { data: allIngredients = [] } = useIngredients();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(recipe?.name ?? "");
  const [prepTime, setPrepTime] = useState(
    recipe ? String(recipe.prepTime) : "",
  );
  const [cookTime, setCookTime] = useState(
    recipe ? String(recipe.cookTime) : "",
  );
  const [servings, setServings] = useState(
    recipe ? String(recipe.servings) : "",
  );
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [instructionType, setInstructionType] = useState<InstructionType>(
    recipe?.instructionType ?? InstructionType.steps,
  );
  const [steps, setSteps] = useState<Array<{ id: string; value: string }>>(
    recipe?.steps?.length
      ? recipe.steps.map((s) => ({ id: crypto.randomUUID(), value: s }))
      : [{ id: crypto.randomUUID(), value: "" }],
  );
  const [freetext, setFreetext] = useState(recipe?.freetext ?? "");
  const [notes, setNotes] = useState(recipe?.notes ?? "");
  const [imagePreview, setImagePreview] = useState<string | null>(
    recipe?.imageId ?? null,
  );
  const [ingredients, setIngredients] = useState<FormIngredient[]>(
    (recipe?.ingredients ?? []).map((ri) => ({
      ...ri,
      _key: crypto.randomUUID(),
    })),
  );
  const [showPicker, setShowPicker] = useState(false);
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Tag helpers
  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };
  const removeTag = (t: string) =>
    setTags((prev) => prev.filter((x) => x !== t));

  // Ingredient helpers
  const handleIngredientSelect = (ingredient: {
    id: string;
    defaultUnit: string;
  }) => {
    const exists = ingredients.find((ri) => ri.ingredientId === ingredient.id);
    if (!exists) {
      setIngredients((prev) => [
        ...prev,
        {
          ingredientId: ingredient.id,
          quantity: 1,
          unit: ingredient.defaultUnit,
          _key: crypto.randomUUID(),
        },
      ]);
    }
  };
  const removeIngredient = (key: string) =>
    setIngredients((prev) => prev.filter((i) => i._key !== key));
  const updateIngredientField = (
    key: string,
    field: "quantity" | "unit",
    value: string | number,
  ) => {
    setIngredients((prev) =>
      prev.map((i) => (i._key === key ? { ...i, [field]: value } : i)),
    );
  };

  // Step helpers
  const addStep = () =>
    setSteps((prev) => [...prev, { id: crypto.randomUUID(), value: "" }]);
  const updateStep = (id: string, val: string) =>
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value: val } : s)),
    );
  const removeStep = (id: string) =>
    setSteps((prev) => prev.filter((s) => s.id !== id));

  // Image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file);
    setImagePreview(dataUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Recipe name is required");
      return;
    }
    setNameError("");
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        ingredients: ingredients.map(({ ingredientId, quantity, unit }) => ({
          ingredientId,
          quantity,
          unit,
        })),
        instructionType: instructionType as string,
        steps:
          instructionType === InstructionType.steps
            ? steps.filter((s) => s.value.trim()).map((s) => s.value)
            : [],
        freetext: instructionType === InstructionType.freetext ? freetext : "",
        prepTime: BigInt(prepTime || 0),
        cookTime: BigInt(cookTime || 0),
        servings: BigInt(servings || 0),
        tags,
        imageId: imagePreview ?? null,
        notes,
      };
      if (recipe) {
        await updateRecipe.mutateAsync({ id: recipe.id, ...payload });
      } else {
        await createRecipe.mutateAsync(payload);
      }
      onSave();
    } catch {
      // error handled by mutation
    } finally {
      setSubmitting(false);
    }
  };

  const tagSuggestions = allTags.filter(
    (t) =>
      t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t),
  );

  return (
    <div
      className="flex flex-col min-h-full bg-background"
      data-ocid="recipe_form.page"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          data-ocid="recipe_form.cancel_button"
          className="-ml-1"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="font-display font-bold text-base flex-1">
          {recipe ? "Edit Recipe" : "New Recipe"}
        </h1>
        <Button
          type="submit"
          form="recipe-form"
          data-ocid="recipe_form.submit_button"
          disabled={submitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 text-sm"
        >
          {submitting ? "Saving…" : "Save"}
        </Button>
      </div>

      <form
        id="recipe-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 p-4 pb-8"
      >
        {/* Image */}
        <div>
          <button
            type="button"
            data-ocid="recipe_form.upload_button"
            onClick={() => fileRef.current?.click()}
            className={cn(
              "w-full aspect-[16/9] rounded-2xl overflow-hidden border-2 border-dashed border-border flex items-center justify-center transition-smooth hover:border-primary",
              imagePreview && "border-solid border-border",
            )}
          >
            {imagePreview ? (
              <div className="relative w-full h-full group">
                <img
                  src={imagePreview}
                  alt="Recipe preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                  <Camera className="size-6 text-white" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Camera className="size-8" />
                <span className="text-sm">Add photo</span>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipe-name">Recipe Name *</Label>
          <Input
            id="recipe-name"
            data-ocid="recipe_form.input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            placeholder="e.g. Lemon Herb Roasted Chicken"
            className={cn(nameError && "border-destructive")}
            autoFocus={!recipe}
          />
          {nameError && (
            <p
              className="text-xs text-destructive"
              data-ocid="recipe_form.field_error"
            >
              {nameError}
            </p>
          )}
        </div>

        {/* Times + Servings */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prep-time" className="text-xs">
              Prep (min)
            </Label>
            <Input
              id="prep-time"
              data-ocid="recipe_form.prep_time_input"
              type="number"
              min="0"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cook-time" className="text-xs">
              Cook (min)
            </Label>
            <Input
              id="cook-time"
              data-ocid="recipe_form.cook_time_input"
              type="number"
              min="0"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="servings" className="text-xs">
              Servings
            </Label>
            <Input
              id="servings"
              data-ocid="recipe_form.servings_input"
              type="number"
              min="0"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1.5">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 text-sm px-2 py-0.5"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="relative">
            <Input
              data-ocid="recipe_form.tags_input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
                if (e.key === "," || e.key === "Tab") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Add a tag (press Enter)"
            />
            {tagInput && tagSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-elevated z-20 overflow-hidden">
                {tagSuggestions.slice(0, 5).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => addTag(sug)}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-smooth"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ingredients */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Ingredients</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="recipe_form.add_ingredient_button"
              onClick={() => setShowPicker(true)}
              className="gap-1.5 text-primary border-primary/40 h-7 px-3 text-xs"
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
          {ingredients.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
              No ingredients added yet
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {ingredients.map((ri) => {
                const ing = allIngredients.find(
                  (i) => i.id === ri.ingredientId,
                );
                return (
                  <div
                    key={ri._key}
                    className="flex items-center gap-2 p-3 bg-card rounded-xl border border-border"
                  >
                    <GripVertical className="size-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                      {ing?.name ?? "Unknown"}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ri.quantity}
                      onChange={(e) =>
                        updateIngredientField(
                          ri._key,
                          "quantity",
                          Number.parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-16 text-center text-sm h-8 px-1"
                    />
                    <Select
                      value={ri.unit}
                      onValueChange={(v) =>
                        updateIngredientField(ri._key, "unit", v)
                      }
                    >
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((u) => (
                          <SelectItem key={u} value={u} className="text-xs">
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIngredient(ri._key)}
                      className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                      aria-label="Remove ingredient"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="flex flex-col gap-3">
          <Label>Instructions</Label>
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            <button
              type="button"
              data-ocid="recipe_form.steps_toggle"
              onClick={() => setInstructionType(InstructionType.steps)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-smooth",
                instructionType === InstructionType.steps
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="size-4" />
              Step-by-Step
            </button>
            <button
              type="button"
              data-ocid="recipe_form.freetext_toggle"
              onClick={() => setInstructionType(InstructionType.freetext)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-smooth",
                instructionType === InstructionType.freetext
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Text className="size-4" />
              Free Text
            </button>
          </div>

          {instructionType === InstructionType.steps ? (
            <div className="flex flex-col gap-2">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-2">
                    {idx + 1}
                  </span>
                  <Input
                    value={step.value}
                    onChange={(e) => updateStep(step.id, e.target.value)}
                    placeholder={`Step ${idx + 1}…`}
                    className="flex-1"
                  />
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(step.id)}
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Remove step"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="recipe_form.add_step_button"
                onClick={addStep}
                className="gap-1.5 self-start text-primary border-primary/40"
              >
                <Plus className="size-3.5" />
                Add Step
              </Button>
            </div>
          ) : (
            <Textarea
              data-ocid="recipe_form.freetext_textarea"
              value={freetext}
              onChange={(e) => setFreetext(e.target.value)}
              placeholder="Write your instructions here…"
              rows={6}
              className="resize-none"
            />
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipe-notes">Notes (optional)</Label>
          <Textarea
            id="recipe-notes"
            data-ocid="recipe_form.notes_textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tips, variations, or personal notes…"
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Bottom actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="recipe_form.cancel_button"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            data-ocid="recipe_form.save_button"
            disabled={submitting}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? "Saving…" : recipe ? "Save Changes" : "Create Recipe"}
          </Button>
        </div>
      </form>

      {/* Ingredient picker modal */}
      {showPicker && (
        <IngredientPicker
          selectedIds={ingredients.map((i) => i.ingredientId)}
          onSelect={(ingredient) => {
            handleIngredientSelect(ingredient);
          }}
          onClose={() => setShowPicker(false)}
          onGoToIngredients={onGoToIngredients}
        />
      )}
    </div>
  );
}
