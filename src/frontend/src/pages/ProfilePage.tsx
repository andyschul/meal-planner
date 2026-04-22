import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Check,
  Crown,
  Home,
  LogOut,
  Pencil,
  Settings,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useHouseholds, useUpdateDisplayName } from "../hooks/use-backend";

interface ProfilePageProps {
  onSignOut: () => void;
  onOpenMemberManagement?: () => void;
  onOpenHouseholdSettings?: () => void;
}

export default function ProfilePage({
  onSignOut,
  onOpenMemberManagement,
  onOpenHouseholdSettings,
}: ProfilePageProps) {
  const { currentUser, logout } = useAuth();
  const { data: households = [] } = useHouseholds();
  const updateDisplayName = useUpdateDisplayName();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.displayName ?? "");
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    setNameInput(currentUser?.displayName ?? "");
  }, [currentUser?.displayName]);

  const household = currentUser?.householdId
    ? households.find((h) => h.id === currentUser.householdId)
    : null;

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === currentUser?.displayName) {
      setEditingName(false);
      return;
    }
    updateDisplayName.mutate(trimmed, {
      onSuccess: () => {
        setEditingName(false);
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2000);
      },
    });
  };

  const handleSignOut = () => {
    logout();
    onSignOut();
  };

  const displayName =
    currentUser?.displayName ||
    (currentUser?.principalId
      ? `${currentUser.principalId.slice(0, 10)}…`
      : "Account");

  const shortPrincipal = currentUser?.principalId
    ? currentUser.principalId.length > 20
      ? `${currentUser.principalId.slice(0, 10)}…${currentUser.principalId.slice(-8)}`
      : currentUser.principalId
    : "Unknown";

  const roleBadgeClass =
    currentUser?.role === "admin"
      ? "border-primary/40 text-primary bg-primary/10"
      : "border-border text-muted-foreground bg-muted";

  return (
    <div
      className="flex flex-col bg-background min-h-full"
      data-ocid="profile.page"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-4 bg-card border-b border-border">
        <h1 className="font-display font-bold text-xl text-foreground">
          Profile
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your account details
        </p>
      </div>

      <div className="px-4 py-5 flex flex-col gap-4 max-w-lg">
        {/* Avatar + Identity card */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <User className="size-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-semibold text-foreground text-base leading-tight truncate">
                {displayName}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 gap-0.5 capitalize",
                  roleBadgeClass,
                )}
              >
                {currentUser?.role === "admin" && (
                  <Crown className="size-2.5" />
                )}
                {currentUser?.role ?? "member"}
              </Badge>
              {nameSaved && (
                <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                  <Check className="size-2.5" />
                  Saved
                </span>
              )}
            </div>
            <p
              className="text-xs text-muted-foreground mt-0.5 font-mono truncate"
              title={currentUser?.principalId}
            >
              {shortPrincipal}
            </p>
          </div>
        </div>

        {/* Display Name (editable) */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Pencil className="size-3.5 text-muted-foreground" />
              Display Name
            </Label>
            {!editingName && (
              <button
                type="button"
                data-ocid="profile.edit-name.button"
                onClick={() => {
                  setNameInput(currentUser?.displayName ?? "");
                  setEditingName(true);
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )}
          </div>

          {editingName ? (
            <div className="flex gap-2">
              <Input
                data-ocid="profile.name.input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                placeholder="Your display name"
                className="flex-1 bg-secondary border-input h-9 text-sm"
                autoFocus
              />
              <Button
                size="sm"
                data-ocid="profile.name.save_button"
                onClick={handleSaveName}
                disabled={updateDisplayName.isPending}
                className="h-9 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                {updateDisplayName.isPending ? (
                  "…"
                ) : (
                  <Check className="size-3.5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingName(false)}
                className="h-9 w-9 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                data-ocid="profile.name.cancel_button"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-foreground">
              {currentUser?.displayName || (
                <span className="text-muted-foreground italic">Not set</span>
              )}
            </p>
          )}
        </div>

        {/* Household */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Home className="size-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Household
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
              {household?.name ?? (
                <span className="text-muted-foreground font-normal italic">
                  No household
                </span>
              )}
            </p>
          </div>
          {onOpenHouseholdSettings && (
            <Button
              size="sm"
              variant="ghost"
              data-ocid="profile.household-settings.button"
              onClick={onOpenHouseholdSettings}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              <Settings className="size-3.5 mr-1" />
              Settings
            </Button>
          )}
        </div>

        {/* Security */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <Shield className="size-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Signed in via Internet Identity
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your identity is secured by the Internet Computer.
            </p>
          </div>
        </div>

        <Separator />

        {/* Quick Links */}
        <div className="flex flex-col gap-2">
          {onOpenHouseholdSettings && (
            <button
              type="button"
              data-ocid="profile.household-settings-link.button"
              onClick={onOpenHouseholdSettings}
              className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border hover:border-primary/40 transition-smooth text-left"
            >
              <Home className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground flex-1">
                Household Settings
              </span>
              <span className="text-xs text-muted-foreground">→</span>
            </button>
          )}

          {currentUser?.role === "admin" && onOpenMemberManagement && (
            <button
              type="button"
              data-ocid="profile.member-management-link.button"
              onClick={onOpenMemberManagement}
              className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border hover:border-primary/40 transition-smooth text-left"
            >
              <Users className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground flex-1">
                Member Management
              </span>
              <span className="text-xs text-muted-foreground">→</span>
            </button>
          )}
        </div>

        {/* Sign out */}
        <Button
          type="button"
          variant="outline"
          data-ocid="profile.signout.button"
          onClick={handleSignOut}
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive gap-2 h-11 mt-1"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
