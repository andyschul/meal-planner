import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import type { TabId } from "./types";

import AdminSetupPage from "./pages/AdminSetupPage";
import CartPage from "./pages/CartPage";
import HouseholdSettingsPage from "./pages/HouseholdSettingsPage";
import IngredientsPage from "./pages/IngredientsPage";
import MemberManagementPage from "./pages/MemberManagementPage";
import MemberSetupPage from "./pages/MemberSetupPage";
import PendingPage from "./pages/PendingPage";
import PlannerPage from "./pages/PlannerPage";
import ProfilePage from "./pages/ProfilePage";
import RecipesPage from "./pages/RecipesPage";
import SignInPage from "./pages/SignInPage";

// ─── Loading spinner ─────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-dvh bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

// ─── Page routing type ───────────────────────────────────────────────────────

type PageId = "tab" | "profile" | "household-settings" | "member-management";

// ─── Inner app (uses auth context) ──────────────────────────────────────────

function AppInner() {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("recipes");
  const [activePage, setActivePage] = useState<PageId>("tab");
  const [isDark, setIsDark] = useState(false);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const handleToggleTheme = () => setIsDark((d) => !d);

  const handleSignOut = () => {
    setActivePage("tab");
    setActiveTab("recipes");
  };

  const handleTabChange = (tab: TabId) => {
    setActivePage("tab");
    setActiveTab(tab);
  };

  const handleOpenSettings = () => setActivePage("profile");
  const handleOpenHouseholdSettings = () => setActivePage("household-settings");
  const handleOpenMemberManagement = () => setActivePage("member-management");

  const handleBackFromPage = () => setActivePage("tab");

  // 1. Loading
  if (isLoading) return <LoadingScreen />;

  // 2. Not authenticated → Sign in
  if (!isAuthenticated) return <SignInPage />;

  // 3. Authenticated but user still fetching
  if (!currentUser) return <LoadingScreen />;

  // 4. Pending approval
  if (currentUser.role === "pending") return <PendingPage />;

  // 5. Admin first-time setup (no household)
  if (currentUser.role === "admin" && !currentUser.householdId) {
    return <AdminSetupPage />;
  }

  // 6. Member without household — goes through setup
  if (currentUser.role === "member" && !currentUser.householdId) {
    return <MemberSetupPage />;
  }

  // 7. Full app for approved members/admins with households
  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      isDark={isDark}
      onToggleTheme={handleToggleTheme}
      onSignOut={handleSignOut}
      onSettings={handleOpenSettings}
      onHouseholdSettings={handleOpenHouseholdSettings}
      onMemberManagement={
        currentUser.role === "admin" ? handleOpenMemberManagement : undefined
      }
    >
      {activePage === "profile" && (
        <ProfilePage
          onSignOut={handleSignOut}
          onOpenMemberManagement={
            currentUser.role === "admin"
              ? handleOpenMemberManagement
              : undefined
          }
          onOpenHouseholdSettings={handleOpenHouseholdSettings}
        />
      )}

      {activePage === "household-settings" && (
        <HouseholdSettingsPage onBack={handleBackFromPage} />
      )}

      {activePage === "member-management" && currentUser.role === "admin" && (
        <MemberManagementPage onBack={handleBackFromPage} />
      )}

      {activePage === "tab" && (
        <>
          {activeTab === "recipes" && <RecipesPage />}
          {activeTab === "planner" && (
            <PlannerPage
              onTabChange={handleTabChange}
              onOpenHouseholdSettings={handleOpenHouseholdSettings}
            />
          )}
          {activeTab === "cart" && (
            <CartPage onOpenHouseholdSettings={handleOpenHouseholdSettings} />
          )}
          {activeTab === "ingredients" && <IngredientsPage />}
        </>
      )}
    </Layout>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
