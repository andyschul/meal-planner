import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Home, User, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useCreateHousehold, useUpdateProfile } from "../hooks/use-backend";

type Step = "display-name" | "create-household" | "done";

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function AdminSetupPage() {
  const { refetchUser } = useAuth();
  const [step, setStep] = useState<Step>("display-name");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [error, setError] = useState("");

  const updateProfile = useUpdateProfile();
  const createHousehold = useCreateHousehold();

  const trimmedName = displayName.trim();
  const trimmedEmail = email.trim();
  const emailInvalid = trimmedEmail !== "" && !isValidEmail(trimmedEmail);
  const canContinueName = trimmedName !== "" && !emailInvalid;

  const handleNameContinue = async () => {
    setError("");
    if (!trimmedName) {
      setError("Display name is required");
      return;
    }
    if (emailInvalid) {
      setError("Please enter a valid email address");
      return;
    }
    try {
      await updateProfile.mutateAsync({
        displayName: trimmedName,
        email: trimmedEmail,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
      return;
    }
    setStep("create-household");
  };

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      setError("Household name is required");
      return;
    }
    setError("");
    try {
      await createHousehold.mutateAsync(householdName.trim());
      setStep("done");
      // Refetch user to update household ID
      setTimeout(() => void refetchUser(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create household");
    }
  };

  const isPending = updateProfile.isPending || createHousehold.isPending;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh bg-background px-6"
      data-ocid="admin_setup.page"
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <UtensilsCrossed className="size-8 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Welcome, Admin!
          </h1>
          <p className="text-sm text-muted-foreground">
            You're the first user — let's set up your app.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 justify-center">
          {(["display-name", "create-household"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step === "done" ||
                        i < ["display-name", "create-household"].indexOf(step)
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < 1 && <div className="w-8 h-0.5 bg-border rounded-full" />}
            </div>
          ))}
        </div>

        {/* Step 1: Display Name */}
        {step === "display-name" && (
          <div
            className="bg-card rounded-2xl border border-border p-6 flex flex-col gap-5"
            data-ocid="admin_setup.name_step.panel"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-foreground">
                  Set your display name
                </h2>
                <p className="text-xs text-muted-foreground">Required</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                data-ocid="admin_setup.name.input"
                placeholder="e.g. Andrew"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleNameContinue();
                }}
              />
              <p className="text-xs text-muted-foreground">
                This is how other household members will see you.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="display-email">Email</Label>
              <Input
                id="display-email"
                type="email"
                data-ocid="admin_setup.email.input"
                placeholder="e.g. andrew@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleNameContinue();
                }}
              />
              <p className="text-xs text-muted-foreground">Optional.</p>
            </div>

            {error && (
              <p
                className="text-sm text-destructive"
                data-ocid="admin_setup.name.error_state"
              >
                {error}
              </p>
            )}

            <Button
              type="button"
              data-ocid="admin_setup.continue_name.button"
              onClick={() => void handleNameContinue()}
              className="w-full"
              disabled={isPending || !canContinueName}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Create Household */}
        {step === "create-household" && (
          <div
            className="bg-card rounded-2xl border border-border p-6 flex flex-col gap-5"
            data-ocid="admin_setup.household_step.panel"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Home className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-foreground">
                  Create your household
                </h2>
                <p className="text-xs text-muted-foreground">Required</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="household-name">Household name</Label>
              <Input
                id="household-name"
                data-ocid="admin_setup.household_name.input"
                placeholder="e.g. The Smith Family"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreateHousehold();
                }}
              />
              <p className="text-xs text-muted-foreground">
                Other members can request to join your household.
              </p>
            </div>

            {error && (
              <p
                className="text-sm text-destructive"
                data-ocid="admin_setup.household.error_state"
              >
                {error}
              </p>
            )}

            <Button
              type="button"
              data-ocid="admin_setup.create_household.button"
              onClick={() => void handleCreateHousehold()}
              disabled={isPending || !householdName.trim()}
              className="w-full"
            >
              {createHousehold.isPending ? "Creating…" : "Create Household"}
            </Button>
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
