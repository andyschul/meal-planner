import { Button } from "@/components/ui/button";
import { Clock, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../hooks/use-auth";

export default function PendingPage() {
  const { currentUser, logout } = useAuth();

  const displayName =
    currentUser?.displayName ||
    currentUser?.name ||
    (currentUser?.principalId
      ? `${currentUser.principalId.slice(0, 8)}…`
      : null);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh bg-background px-6"
      data-ocid="pending.page"
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
            <UtensilsCrossed className="size-8 text-primary" />
          </div>
        </div>

        {/* Icon + heading */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
            <Clock className="size-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">
              Waiting for Approval
            </h1>
            {displayName && (
              <p className="text-sm text-primary font-medium mt-1">
                Hi {displayName} 👋
              </p>
            )}
          </div>
        </div>

        {/* Message */}
        <div className="bg-card rounded-2xl border border-border p-5 text-left w-full">
          <p className="text-sm text-foreground leading-relaxed font-medium mb-3">
            Your request to join has been sent to the admin.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sign in again once you've been approved to get access. The admin
            will receive a notification and review your request shortly.
          </p>

          {/* Show submitted info for reassurance */}
          {(currentUser?.email || currentUser?.name) && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Request submitted as
              </p>
              {currentUser.name && (
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Name: </span>
                  {currentUser.name}
                </p>
              )}
              {currentUser.email && (
                <p className="text-sm text-foreground mt-1">
                  <span className="text-muted-foreground">Email: </span>
                  {currentUser.email}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sign out */}
        <Button
          type="button"
          variant="outline"
          data-ocid="pending.signout.button"
          onClick={logout}
          className="w-full h-11"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
