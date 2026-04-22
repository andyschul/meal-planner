import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Home,
  ShoppingBasket,
  ShoppingCart,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import {
  useIngredients,
  useShoppingCart,
  useUncheckAll,
  useUpdateCartItem,
} from "../hooks/use-backend";
import { addDays, formatPlannerDate, weekStart } from "../lib/utils";
import type { ShoppingCartItem } from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekRange(ws: string): string {
  const monLabel = formatPlannerDate(ws);
  const sunLabel = formatPlannerDate(addDays(ws, 6));
  return `${monLabel} – ${sunLabel}`;
}

// ─── Category Section ─────────────────────────────────────────────────────────

interface CategorySectionProps {
  category: string;
  items: ShoppingCartItem[];
  ingredientMap: Map<string, string>;
  defaultOpen?: boolean;
  onToggleItem: (item: ShoppingCartItem, checked: boolean) => void;
  pendingKeys: Set<string>;
}

function CategorySection({
  category,
  items,
  ingredientMap,
  defaultOpen = false,
  onToggleItem,
  pendingKeys,
}: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border/40 shadow-card">
      <button
        type="button"
        data-ocid="cart.category_toggle"
        className="w-full flex items-center justify-between px-4 py-3 transition-smooth hover:bg-muted/30"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="font-display font-semibold text-sm text-foreground truncate">
            {category}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
            {checkedCount}/{items.length}
          </span>
        </div>
        {checkedCount === items.length && items.length > 0 && (
          <CheckCheck className="w-4 h-4 text-primary flex-shrink-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="items"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="divide-y divide-border/30">
              {items.map((item, idx) => {
                const key = `${item.ingredientId}::${item.unit}`;
                const isPending = pendingKeys.has(key);
                const ingredientName =
                  ingredientMap.get(item.ingredientId) ?? item.ingredientId;

                return (
                  <div
                    key={key}
                    data-ocid={`cart.item.${idx + 1}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-smooth",
                      item.checked && "opacity-50",
                    )}
                  >
                    <Checkbox
                      data-ocid={`cart.checkbox.${idx + 1}`}
                      id={`cart-item-${key}`}
                      checked={item.checked}
                      disabled={isPending}
                      onCheckedChange={(val) =>
                        onToggleItem(item, val === true)
                      }
                      className="flex-shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      aria-label={`Mark ${ingredientName} as ${item.checked ? "unchecked" : "checked"}`}
                    />
                    <label
                      htmlFor={`cart-item-${key}`}
                      className={cn(
                        "flex-1 text-sm font-body min-w-0 cursor-pointer transition-smooth",
                        item.checked
                          ? "line-through text-muted-foreground"
                          : "text-foreground",
                      )}
                    >
                      {ingredientName}
                    </label>
                    <span
                      className={cn(
                        "text-sm font-mono flex-shrink-0 transition-smooth",
                        item.checked
                          ? "text-muted-foreground"
                          : "text-foreground font-medium",
                      )}
                    >
                      {item.totalQuantity % 1 === 0
                        ? item.totalQuantity.toString()
                        : item.totalQuantity.toFixed(2)}{" "}
                      {item.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function CartSkeleton() {
  return (
    <div className="space-y-3" data-ocid="cart.loading_state">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-xl p-4 border border-border/40">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface CartPageProps {
  onOpenHouseholdSettings?: () => void;
}

export default function CartPage({ onOpenHouseholdSettings }: CartPageProps) {
  const { currentUser } = useAuth();
  const ws = weekStart();

  // All hooks must be called unconditionally
  const { data: cart, isLoading: cartLoading } = useShoppingCart(ws);
  const { data: ingredients = [], isLoading: ingLoading } = useIngredients();
  const updateCartItem = useUpdateCartItem();
  const uncheckAll = useUncheckAll();
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  const ingredientMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ing of ingredients) {
      map.set(ing.id, ing.name);
    }
    return map;
  }, [ingredients]);

  const groupedItems = useMemo(() => {
    const items = cart?.items ?? [];
    const groups = new Map<string, ShoppingCartItem[]>();
    for (const item of items) {
      const cat = item.category || "Other";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(item);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [cart?.items]);

  const totalItems = cart?.items.length ?? 0;
  const checkedItems = cart?.items.filter((i) => i.checked).length ?? 0;
  const progressPct = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  const handleToggleItem = useCallback(
    (item: ShoppingCartItem, checked: boolean) => {
      const key = `${item.ingredientId}::${item.unit}`;
      setPendingKeys((prev) => new Set([...prev, key]));
      updateCartItem.mutate(
        {
          weekStart: ws,
          ingredientId: item.ingredientId,
          unit: item.unit,
          checked,
        },
        {
          onSettled: () => {
            setPendingKeys((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          },
        },
      );
    },
    [ws, updateCartItem],
  );

  const handleUncheckAll = useCallback(() => {
    uncheckAll.mutate(ws);
  }, [ws, uncheckAll]);

  const isLoading = cartLoading || ingLoading;
  const isEmpty = !isLoading && totalItems === 0;

  // No household state — shown after all hooks
  if (!currentUser?.householdId) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-full py-20 px-6 text-center bg-background"
        data-ocid="cart.no-household.page"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <Home className="size-10 text-primary" />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-2">
          No household yet
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
          Join or create a household to view your shopping cart.
        </p>
        {onOpenHouseholdSettings && (
          <Button
            onClick={onOpenHouseholdSettings}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            data-ocid="cart.no-household.settings_button"
          >
            <Home className="size-4" />
            Household Settings
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border/50 px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h1 className="font-display font-bold text-2xl text-foreground leading-tight">
              Shopping Cart
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span
                className="text-xs text-muted-foreground"
                data-ocid="cart.week_range"
              >
                {getWeekRange(ws)}
              </span>
            </div>
          </div>
          {!isEmpty && checkedItems > 0 && (
            <Button
              variant="ghost"
              size="sm"
              data-ocid="cart.uncheck_all_button"
              onClick={handleUncheckAll}
              disabled={uncheckAll.isPending}
              className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Uncheck All
            </Button>
          )}
        </div>

        {!isEmpty && (
          <div className="mt-2.5" data-ocid="cart.progress">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {checkedItems === totalItems && totalItems > 0
                  ? "All done! 🎉"
                  : `${checkedItems} of ${totalItems} items checked`}
              </span>
              <span className="text-xs font-mono text-primary font-semibold">
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading && <CartSkeleton />}

        {isEmpty && (
          <motion.div
            key="empty"
            data-ocid="cart.empty_state"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center pt-16 pb-8 px-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <ShoppingBasket className="w-9 h-9 text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-lg text-foreground mb-2">
              Your cart is empty
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Add recipes to your weekly plan to automatically generate your
              shopping list.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <ShoppingCart className="w-4 h-4" />
              <span>Go to the Planner tab to get started</span>
            </div>
          </motion.div>
        )}

        {!isLoading && !isEmpty && (
          <motion.div
            key="list"
            data-ocid="cart.list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {groupedItems.map(([category, items], catIdx) => (
              <CategorySection
                key={category}
                category={category}
                items={items}
                ingredientMap={ingredientMap}
                defaultOpen={catIdx === 0}
                onToggleItem={handleToggleItem}
                pendingKeys={pendingKeys}
              />
            ))}
            <div className="h-4" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
