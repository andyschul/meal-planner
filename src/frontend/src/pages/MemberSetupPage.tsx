import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Home, Plus, User, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import {
  useCreateHousehold,
  useHouseholds,
  useRequestJoinHousehold,
  useUpdateDisplayName,
} from "../hooks/use-backend";
import type { Household } from "../types";

type Step = "display-name" | "household" | "join-sent" | "done";

export default function MemberSetupPage() {
  const { refetchUser } = useAuth();
  const [step, setStep] = useState<Step>("display-name");
  const [displayName, setDisplayName] = useState("");
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState("");
  const [joinedHousehold, setJoinedHousehold] = useState<string>("");

  const { data: households = [] } = useHouseholds();
  const updateDisplayName = useUpdateDisplayName();
  const createHousehold = useCreateHousehold();
  const requestJoin = useRequestJoinHousehold();

  const isPending =
    updateDisplayName.isPending ||
    createHousehold.isPending ||
    requestJoin.isPending;

  const handleNameContinue = async (skip = false) => {
    setError("");
    if (!skip && displayName.trim()) {
      try {
        await updateDisplayName.mutateAsync(displayName.trim());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save name");
        return;
      }
    }
    setStep("household");
  };

  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim()) {
      setError("Household name is required");
      return;
    }
    setError("");
    try {
      await createHousehold.mutateAsync(newHouseholdName.trim());
      setStep("done");
      setTimeout(() => void refetchUser(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create household");
    }
  };

  const handleRequestJoin = async (household: Household) => {
    setError("");
    try {
      await requestJoin.mutateAsync(household.id);
      setJoinedHousehold(household.name);
      setStep("join-sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send join request");
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh bg-background px-6 py-10"
      data-ocid="member_setup.page"
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <UtensilsCrossed className="size-8 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Welcome!
          </h1>
          <p className="text-sm text-muted-foreground">
            You've been approved. Let's finish setting up your account.
          </p>
        </div>

        {/* Step 1: Display Name */}
        {step === "display-name" && (
          <div
            className="bg-card rounded-2xl border border-border p-6 flex flex-col gap-5"
            data-ocid="member_setup.name_step.panel"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-foreground">
                  Set your display name
                </h2>
                <p className="text-xs text-muted-foreground">Optional</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                data-ocid="member_setup.name.input"
                placeholder="e.g. Sarah"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleNameContinue();
                }}
              />
            </div>

            {error && (
              <p
                className="text-sm text-destructive"
                data-ocid="member_setup.name.error_state"
              >
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                data-ocid="member_setup.skip_name.button"
                onClick={() => void handleNameContinue(true)}
                className="flex-1"
                disabled={isPending}
              >
                Skip
              </Button>
              <Button
                type="button"
                data-ocid="member_setup.continue_name.button"
                onClick={() => void handleNameContinue()}
                className="flex-1"
                disabled={isPending}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Join or Create Household */}
        {step === "household" && (
          <div className="flex flex-col gap-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Home className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-lg text-foreground">
                    Join or Create a Household
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Required to use Planner &amp; Shopping Cart
                  </p>
                </div>
              </div>

              {/* Existing households */}
              {households.length > 0 ? (
                <div
                  className="flex flex-col gap-2 mb-4"
                  data-ocid="member_setup.households.list"
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Existing Households
                  </p>
                  {households.map((h, i) => (
                    <div
                      key={h.id}
                      data-ocid={`member_setup.household.item.${i + 1}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Home className="size-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">
                          {h.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-ocid={`member_setup.request_join.button.${i + 1}`}
                        onClick={() => void handleRequestJoin(h)}
                        disabled={isPending}
                        className="shrink-0 text-xs"
                      >
                        Request to Join
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  No households exist yet. Create the first one!
                </p>
              )}

              {/* Create new household */}
              {!showCreateForm ? (
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="member_setup.show_create_form.button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full gap-2"
                >
                  <Plus className="size-4" />
                  Create a New Household
                </Button>
              ) : (
                <div className="flex flex-col gap-3 pt-3 border-t border-border mt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    New Household
                  </p>
                  <Input
                    data-ocid="member_setup.household_name.input"
                    placeholder="e.g. Andrew & Sarah"
                    value={newHouseholdName}
                    onChange={(e) => setNewHouseholdName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleCreateHousehold();
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      data-ocid="member_setup.create_household.button"
                      onClick={() => void handleCreateHousehold()}
                      disabled={isPending || !newHouseholdName.trim()}
                      className="flex-1"
                    >
                      {createHousehold.isPending ? "Creating…" : "Create"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p
                className="text-sm text-destructive text-center"
                data-ocid="member_setup.household.error_state"
              >
                {error}
              </p>
            )}
          </div>
        )}

        {/* Join request sent */}
        {step === "join-sent" && (
          <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground">
                Join Request Sent!
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Your request to join{" "}
                <span className="font-semibold text-foreground">
                  {joinedHousehold}
                </span>{" "}
                has been sent. You'll be added once the household creator
                approves you.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Sign in again after you're approved to get full access.
            </p>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="size-12 text-primary" />
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground">
                All set!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Loading your app…
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
