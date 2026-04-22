import {
  type InternetIdentityContext,
  createActorWithConfig,
  useInternetIdentity,
} from "@caffeineai/core-infrastructure";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createActor } from "../backend";
import type { AppUser } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: AppUser | null;
  login: InternetIdentityContext["login"];
  logout: () => void;
  refetchUser: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helper: map backend User to AppUser ─────────────────────────────────────

type RawRole = { admin: null } | { member: null } | { pending: null } | string;

interface RawUser {
  principalId: { toText: () => string } | string;
  displayName: string;
  householdId?: string;
  role: RawRole;
  createdAt: bigint;
  name: string;
  email: string;
}

function mapUser(raw: RawUser): AppUser {
  const principalId =
    typeof raw.principalId === "string"
      ? raw.principalId
      : raw.principalId.toText();

  let role: AppUser["role"] = "pending";
  if (typeof raw.role === "string") {
    role = raw.role as AppUser["role"];
  } else if ("admin" in raw.role) {
    role = "admin";
  } else if ("member" in raw.role) {
    role = "member";
  }

  return {
    principalId,
    displayName: raw.displayName,
    householdId: raw.householdId ?? null,
    role,
    createdAt: raw.createdAt,
    name: raw.name,
    email: raw.email,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { login, clear, isAuthenticated, isInitializing, identity } =
    useInternetIdentity();

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const registeredRef = useRef(false);

  const fetchUser = useCallback(async () => {
    if (!isAuthenticated) return;
    setUserLoading(true);
    try {
      const actor = await createActorWithConfig(createActor, {
        agentOptions: identity ? { identity } : undefined,
      });

      // Register or get user on first auth (idempotent)
      if (!registeredRef.current) {
        registeredRef.current = true;
        await actor.registerOrGetUser("", "");
      }

      const res = await actor.getCurrentUser();
      if (res.__kind__ === "ok") {
        setCurrentUser(mapUser(res.ok as unknown as RawUser));
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setUserLoading(false);
    }
  }, [isAuthenticated, identity]);

  // Fetch user whenever auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentUser(null);
      registeredRef.current = false;
      return;
    }
    void fetchUser();
  }, [isAuthenticated, fetchUser]);

  const logout = useCallback(() => {
    clear();
    setCurrentUser(null);
    registeredRef.current = false;
  }, [clear]);

  const isLoading = isInitializing || (isAuthenticated && userLoading);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      currentUser,
      login,
      logout,
      refetchUser: fetchUser,
    }),
    [isAuthenticated, isLoading, currentUser, login, logout, fetchUser],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
