import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Search, X } from "lucide-react";
import { useState } from "react";
import { useIngredients } from "../hooks/use-backend";
import type { Ingredient } from "../types";

interface IngredientPickerProps {
  selectedIds: string[];
  onSelect: (ingredient: Ingredient) => void;
  onClose: () => void;
  onGoToIngredients?: () => void;
}

export function IngredientPicker({
  selectedIds,
  onSelect,
  onClose,
  onGoToIngredients,
}: IngredientPickerProps) {
  const { data: ingredients = [], isLoading } = useIngredients();
  const [search, setSearch] = useState("");

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      data-ocid="ingredient_picker.dialog"
    >
      <div className="bg-card rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col shadow-elevated border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <h2 className="font-display font-bold text-base">Add Ingredient</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-ocid="ingredient_picker.close_button"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              data-ocid="ingredient_picker.search_input"
              placeholder="Search ingredients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading…
            </div>
          ) : ingredients.length === 0 ? (
            <div
              className="p-8 text-center"
              data-ocid="ingredient_picker.empty_state"
            >
              <p className="text-muted-foreground text-sm mb-3">
                No ingredients yet.
              </p>
              {onGoToIngredients && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onGoToIngredients}
                  className="text-primary border-primary/40"
                >
                  Go to Ingredients tab
                </Button>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No ingredients match "{search}"
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((ingredient) => {
                const isSelected = selectedIds.includes(ingredient.id);
                return (
                  <li key={ingredient.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(ingredient)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-smooth hover:bg-muted",
                        isSelected && "bg-primary/10",
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-smooth",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-border",
                        )}
                      >
                        {isSelected && (
                          <Check className="size-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {ingredient.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ingredient.category}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {ingredient.defaultUnit}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-3 border-t border-border">
          <Button
            type="button"
            data-ocid="ingredient_picker.cancel_button"
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
