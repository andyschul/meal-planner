import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CalendarDays,
  Home,
  LogOut,
  Moon,
  Settings,
  ShoppingCart,
  Sun,
  User,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { usePendingUsers } from "../hooks/use-backend";
import type { TabId } from "../types";
import { TABS } from "../types";

const TAB_ICONS: Record<TabId, React.ComponentType<{ className?: string }>> = {
  recipes: UtensilsCrossed,
  planner: CalendarDays,
  cart: ShoppingCart,
  ingredients: BookOpen,
};

interface LayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
  onSettings: () => void;
  onHouseholdSettings?: () => void;
  onMemberManagement?: () => void;
  children: React.ReactNode;
}

function ProfileDropdown({
  isDark,
  onToggleTheme,
  onSignOut,
  onSettings,
  onHouseholdSettings,
  onMemberManagement,
  size = "default",
}: {
  isDark: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
  onSettings: () => void;
  onHouseholdSettings?: () => void;
  onMemberManagement?: () => void;
  size?: "default" | "mobile";
}) {
  const { currentUser, logout } = useAuth();
  const { data: pendingUsers } = usePendingUsers();
  const pendingCount =
    currentUser?.role === "admin" ? (pendingUsers?.length ?? 0) : 0;

  const displayName =
    currentUser?.displayName ||
    (currentUser?.principalId
      ? `${currentUser.principalId.slice(0, 8)}…`
      : "Account");

  const handleSignOut = () => {
    logout();
    onSignOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-ocid="profile.open_modal_button"
          className={cn(
            "rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative",
            size === "mobile" ? "min-w-[44px] min-h-[44px]" : "",
          )}
          aria-label="Profile menu"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/20">
            <User className="size-4 text-primary" />
          </div>
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {pendingCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-60 rounded-xl shadow-lg border border-border bg-card p-1"
      >
        {/* User info header */}
        <DropdownMenuLabel className="px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground truncate">
            {displayName}
          </p>
          {currentUser?.householdId && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Home className="size-3 shrink-0" />
              <span className="truncate">
                {currentUser.displayName
                  ? `${currentUser.displayName}'s household`
                  : "Your household"}
              </span>
            </p>
          )}
          {currentUser?.role === "admin" && (
            <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary">
              Admin
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1" />

        {/* Dark mode toggle */}
        <DropdownMenuItem
          data-ocid="profile.theme.toggle"
          onClick={onToggleTheme}
          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <Moon className="size-4 text-muted-foreground" />
            ) : (
              <Sun className="size-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {isDark ? "Dark mode" : "Light mode"}
            </span>
          </div>
          <div
            className={cn(
              "rounded-full border transition-colors relative flex-shrink-0",
              isDark ? "bg-primary border-primary" : "bg-muted border-border",
            )}
            style={{ width: 32, height: 18 }}
          >
            <div
              className={cn(
                "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-background shadow-sm transition-transform",
                isDark ? "translate-x-[14px]" : "translate-x-0.5",
              )}
            />
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        {/* Profile & Settings */}
        <DropdownMenuItem
          data-ocid="profile.settings.button"
          onClick={onSettings}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer"
        >
          <Settings className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Profile &amp; Settings</span>
        </DropdownMenuItem>

        {/* Household Settings */}
        {currentUser?.householdId && onHouseholdSettings && (
          <DropdownMenuItem
            data-ocid="profile.household_settings.button"
            onClick={onHouseholdSettings}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer"
          >
            <Home className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Household Settings</span>
          </DropdownMenuItem>
        )}

        {/* Member Management (admin only) */}
        {currentUser?.role === "admin" && onMemberManagement && (
          <DropdownMenuItem
            data-ocid="profile.member_management.button"
            onClick={onMemberManagement}
            className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Users className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Member Management</span>
            </div>
            {pendingCount > 0 && (
              <span className="min-w-[20px] h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                {pendingCount}
              </span>
            )}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="my-1" />

        {/* Sign out */}
        <DropdownMenuItem
          data-ocid="profile.signout.button"
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          <span className="text-sm font-medium">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({
  activeTab,
  onTabChange,
  isDark,
  onToggleTheme,
  onSignOut,
  onSettings,
  onHouseholdSettings,
  onMemberManagement,
  children,
}: LayoutProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground">
      {/* Desktop top nav */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="text-primary" size={22} />
          <span className="font-display font-bold text-lg tracking-tight">
            Meal Planner
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                data-ocid={`nav.${tab.id}.tab`}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
        <ProfileDropdown
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onSignOut={onSignOut}
          onSettings={onSettings}
          onHouseholdSettings={onHouseholdSettings}
          onMemberManagement={onMemberManagement}
        />
      </header>

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="text-primary" size={20} />
          <span className="font-display font-bold text-base tracking-tight">
            Meal Planner
          </span>
        </div>
        <ProfileDropdown
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onSignOut={onSignOut}
          onSettings={onSettings}
          onHouseholdSettings={onHouseholdSettings}
          onMemberManagement={onMemberManagement}
          size="mobile"
        />
      </header>

      {/* Page content — add bottom padding on mobile for tab bar */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch">
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-ocid={`bottom-nav.${tab.id}.tab`}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-smooth relative",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
                )}
                <Icon className="size-5" />
                <span className="text-[10px] font-medium leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
