import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  Home,
  Trash2,
  UserCheck,
  UserMinus,
  UserX,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import {
  useApproveUser,
  useClearAllData,
  useDenyUser,
  useGetUsers,
  usePendingUsers,
  useRemoveUser,
  useTransferAdminRole,
} from "../hooks/use-backend";
import type { AppUser } from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncatePrincipal(id: string) {
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id;
}

function getUserLabel(user: AppUser): string {
  return user.displayName || user.name || truncatePrincipal(user.principalId);
}

// ─── Inline confirmation row ──────────────────────────────────────────────────

interface ConfirmRowProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  confirmLabel?: string;
  confirmVariant?: "destructive" | "default";
}

function ConfirmRow({
  message,
  onConfirm,
  onCancel,
  isPending,
  confirmLabel = "Confirm",
  confirmVariant = "destructive",
}: ConfirmRowProps) {
  return (
    <div className="mt-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-sm">
      <p className="text-foreground mb-3 leading-snug">{message}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-8 text-xs"
          data-ocid="confirm.cancel_button"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 h-8 text-xs"
          data-ocid="confirm.confirm_button"
        >
          {isPending ? "Working…" : confirmLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── Section: Pending Requests ────────────────────────────────────────────────

function PendingRequestsSection() {
  const { data: pendingUsers = [], isLoading } = usePendingUsers();
  const approveUser = useApproveUser();
  const denyUser = useDenyUser();
  const [confirmDeny, setConfirmDeny] = useState<string | null>(null);
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());

  const handleApprove = (user: AppUser) => {
    approveUser.mutate(user.principalId, {
      onSuccess: () => {
        setSuccessIds((s) => new Set([...s, user.principalId]));
      },
    });
  };

  const handleDeny = (principalId: string) => {
    denyUser.mutate(principalId, {
      onSuccess: () => setConfirmDeny(null),
    });
  };

  return (
    <section data-ocid="member-mgmt.pending.section" className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="size-4 text-muted-foreground" />
        <h2 className="font-display font-bold text-base text-foreground">
          Pending Requests
        </h2>
        {pendingUsers.length > 0 && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
            {pendingUsers.length}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : pendingUsers.length === 0 ? (
        <div
          data-ocid="member-mgmt.pending.empty_state"
          className="bg-card border border-border rounded-xl px-4 py-5 text-center"
        >
          <CheckCircle2 className="size-8 text-primary/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No pending requests</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingUsers.map((user, idx) => {
            const approved = successIds.has(user.principalId);
            return (
              <div
                key={user.principalId}
                data-ocid={`member-mgmt.pending.item.${idx + 1}`}
                className={`bg-card border rounded-xl px-4 py-3 transition-smooth ${
                  approved ? "border-primary/40 bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {getUserLabel(user)}
                    </p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {user.email}
                      </p>
                    )}
                    {user.name && user.name !== user.displayName && (
                      <p className="text-xs text-muted-foreground">
                        {user.name}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      Requested {formatDate(user.createdAt)}
                    </p>
                  </div>
                  {!approved && (
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        data-ocid={`member-mgmt.approve.button.${idx + 1}`}
                        onClick={() => handleApprove(user)}
                        disabled={approveUser.isPending}
                        className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                      >
                        <UserCheck className="size-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`member-mgmt.deny.button.${idx + 1}`}
                        onClick={() =>
                          setConfirmDeny(
                            confirmDeny === user.principalId
                              ? null
                              : user.principalId,
                          )
                        }
                        className="h-8 px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/5 gap-1"
                      >
                        <UserX className="size-3" />
                        Deny
                      </Button>
                    </div>
                  )}
                  {approved && (
                    <span className="text-xs font-medium text-primary flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="size-3.5" />
                      Approved
                    </span>
                  )}
                </div>
                {confirmDeny === user.principalId && (
                  <ConfirmRow
                    message={`Deny ${getUserLabel(user)}? They will need to sign in again to request access.`}
                    confirmLabel="Deny Access"
                    onConfirm={() => handleDeny(user.principalId)}
                    onCancel={() => setConfirmDeny(null)}
                    isPending={denyUser.isPending}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Section: Members List ────────────────────────────────────────────────────

function MembersListSection() {
  const { currentUser } = useAuth();
  const { data: allUsers = [], isLoading } = useGetUsers();
  const removeUser = useRemoveUser();
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const members = allUsers.filter(
    (u) => u.role === "member" || u.role === "admin",
  );

  const handleRemove = (principalId: string) => {
    removeUser.mutate(principalId, {
      onSuccess: () => setConfirmRemove(null),
    });
  };

  return (
    <section data-ocid="member-mgmt.members.section" className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Users className="size-4 text-muted-foreground" />
        <h2 className="font-display font-bold text-base text-foreground">
          Members
        </h2>
        <span className="text-xs text-muted-foreground">
          ({members.length})
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div
          data-ocid="member-mgmt.members.empty_state"
          className="bg-card border border-border rounded-xl px-4 py-5 text-center"
        >
          <p className="text-sm text-muted-foreground">No members yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((user, idx) => {
            const isSelf = user.principalId === currentUser?.principalId;
            return (
              <div
                key={user.principalId}
                data-ocid={`member-mgmt.member.item.${idx + 1}`}
                className="bg-card border border-border rounded-xl px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-foreground truncate">
                        {getUserLabel(user)}
                        {isSelf && (
                          <span className="text-muted-foreground font-normal ml-1">
                            (you)
                          </span>
                        )}
                      </p>
                      {user.role === "admin" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary gap-0.5"
                        >
                          <Crown className="size-2.5" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    {user.householdId && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Home className="size-3" />
                        Has a household
                      </p>
                    )}
                  </div>
                  {!isSelf && user.role !== "admin" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      data-ocid={`member-mgmt.remove.button.${idx + 1}`}
                      onClick={() =>
                        setConfirmRemove(
                          confirmRemove === user.principalId
                            ? null
                            : user.principalId,
                        )
                      }
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      aria-label={`Remove ${getUserLabel(user)}`}
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  )}
                </div>
                {confirmRemove === user.principalId && (
                  <ConfirmRow
                    message={`Remove ${getUserLabel(user)}? They will lose all access. Their created recipes will remain.`}
                    confirmLabel="Remove Member"
                    onConfirm={() => handleRemove(user.principalId)}
                    onCancel={() => setConfirmRemove(null)}
                    isPending={removeUser.isPending}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Section: Transfer Admin ──────────────────────────────────────────────────

function TransferAdminSection() {
  const { currentUser } = useAuth();
  const { data: allUsers = [] } = useGetUsers();
  const transferAdmin = useTransferAdminRole();
  const [selectedPrincipal, setSelectedPrincipal] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const eligibleMembers = allUsers.filter(
    (u) => u.role === "member" && u.principalId !== currentUser?.principalId,
  );

  const selectedUser = eligibleMembers.find(
    (u) => u.principalId === selectedPrincipal,
  );

  const handleTransfer = () => {
    if (!selectedPrincipal) return;
    transferAdmin.mutate(selectedPrincipal, {
      onSuccess: () => {
        setShowConfirm(false);
        setDone(true);
      },
    });
  };

  if (done) {
    return (
      <section className="mb-6">
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-4 text-center">
          <Crown className="size-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">
            Admin role transferred!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You are now a regular member.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section data-ocid="member-mgmt.transfer-admin.section" className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="size-4 text-muted-foreground" />
        <h2 className="font-display font-bold text-base text-foreground">
          Transfer Admin Role
        </h2>
      </div>

      <div className="bg-card border border-border rounded-xl px-4 py-4 flex flex-col gap-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Transfer admin privileges to another member. You will become a regular
          member.
        </p>
        {eligibleMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No other members to transfer to.
          </p>
        ) : (
          <>
            <div className="flex gap-2">
              <Select
                value={selectedPrincipal}
                onValueChange={(v) => {
                  setSelectedPrincipal(v);
                  setShowConfirm(false);
                }}
              >
                <SelectTrigger
                  data-ocid="member-mgmt.transfer.select"
                  className="flex-1 bg-secondary border-input"
                >
                  <SelectValue placeholder="Select a member…" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMembers.map((u) => (
                    <SelectItem key={u.principalId} value={u.principalId}>
                      {getUserLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                data-ocid="member-mgmt.transfer.button"
                disabled={!selectedPrincipal}
                onClick={() => setShowConfirm(true)}
                className="h-9 px-3 text-xs shrink-0"
              >
                Transfer
              </Button>
            </div>
            {showConfirm && selectedUser && (
              <ConfirmRow
                message={`Transfer admin role to ${getUserLabel(selectedUser)}? You will become a regular member and lose admin access.`}
                confirmLabel="Transfer Admin"
                confirmVariant="destructive"
                onConfirm={handleTransfer}
                onCancel={() => setShowConfirm(false)}
                isPending={transferAdmin.isPending}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ─── Section: Clear All Data ──────────────────────────────────────────────────

function ClearAllDataSection() {
  const clearAllData = useClearAllData();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [done, setDone] = useState(false);

  const handleClear = () => {
    if (deleteText !== "DELETE") return;
    clearAllData.mutate(undefined, {
      onSuccess: () => {
        setShowConfirm(false);
        setDeleteText("");
        setDone(true);
      },
    });
  };

  return (
    <section data-ocid="member-mgmt.danger.section" className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="size-4 text-destructive" />
        <h2 className="font-display font-bold text-base text-destructive">
          Danger Zone
        </h2>
      </div>

      <div className="bg-card border border-destructive/30 rounded-xl px-4 py-4">
        <div className="flex items-start gap-3 mb-3">
          <Trash2 className="size-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm text-foreground">
              Clear All Data
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Wipes all users, households, recipes, ingredients, and plans.
              Useful for resetting test data. This cannot be undone.
            </p>
          </div>
        </div>

        {!showConfirm && !done && (
          <Button
            size="sm"
            variant="destructive"
            data-ocid="member-mgmt.clear-data.button"
            onClick={() => setShowConfirm(true)}
            className="h-8 px-3 text-xs w-full"
          >
            Clear All Data
          </Button>
        )}

        {done && (
          <p className="text-xs text-primary font-medium text-center py-2">
            All data cleared successfully.
          </p>
        )}

        {showConfirm && !done && (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20">
              <p className="text-sm text-foreground font-medium mb-1">
                Are you absolutely sure?
              </p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                This will permanently delete all data. Type{" "}
                <strong>DELETE</strong> to confirm.
              </p>
              <Label
                htmlFor="delete-confirm-input"
                className="text-xs font-medium"
              >
                Type DELETE to confirm
              </Label>
              <Input
                id="delete-confirm-input"
                data-ocid="member-mgmt.clear-data.confirm_input"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE"
                className="mt-1.5 bg-background border-input h-9 text-sm font-mono"
              />
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowConfirm(false);
                    setDeleteText("");
                  }}
                  className="flex-1 h-8 text-xs"
                  data-ocid="member-mgmt.clear-data.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleClear}
                  disabled={deleteText !== "DELETE" || clearAllData.isPending}
                  className="flex-1 h-8 text-xs"
                  data-ocid="member-mgmt.clear-data.confirm_button"
                >
                  {clearAllData.isPending ? "Clearing…" : "Confirm Clear"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface MemberManagementPageProps {
  onBack: () => void;
}

export default function MemberManagementPage({
  onBack,
}: MemberManagementPageProps) {
  return (
    <div
      className="flex flex-col bg-background min-h-full"
      data-ocid="member-mgmt.page"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          type="button"
          data-ocid="member-mgmt.back.button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-muted transition-smooth text-muted-foreground hover:text-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-lg text-foreground leading-tight">
            Member Management
          </h1>
          <p className="text-xs text-muted-foreground">Admin access only</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5 max-w-lg">
        <PendingRequestsSection />
        <MembersListSection />
        <TransferAdminSection />
        <ClearAllDataSection />
      </div>
    </div>
  );
}
