import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import { useAuth } from "../hooks/use-auth";

export default function SignInPage() {
  const { login } = useAuth();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh bg-background px-6"
      data-ocid="signin.page"
    >
      {/* Card */}
      <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-sm">
            <UtensilsCrossed className="size-10 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground tracking-tight">
              Meal Planner
            </h1>
            <p className="text-base text-primary font-medium mt-1">
              A shared meal planner for your family
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          Plan your weekly meals, manage your grocery shopping, and share
          recipes with everyone in your household — all in one place.
        </p>

        {/* Features */}
        <div className="w-full bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
          {[
            { emoji: "📋", text: "Plan meals for the whole week" },
            { emoji: "🛒", text: "Auto-generate your shopping list" },
            { emoji: "👨‍👩‍👧‍👦", text: "Share with your household" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 text-left">
              <span className="text-lg shrink-0">{item.emoji}</span>
              <span className="text-sm text-foreground font-medium">
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Sign in button */}
        <div className="w-full flex flex-col gap-3">
          <Button
            type="button"
            data-ocid="signin.signin.button"
            onClick={() => void login()}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-colors shadow-sm"
          >
            Sign In with Internet Identity
          </Button>
          <p className="text-xs text-muted-foreground">
            Secured by the Internet Computer
          </p>
        </div>
      </div>
    </div>
  );
}
