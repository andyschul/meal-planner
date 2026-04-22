import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  Home,
  LogOut,
  UserCheck,
  UserMinus,
  UserX,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import {
  useApproveJoinRequest,
  useDenyJoinRequest,
  useHouseholdJoinRequests,
  useHouseholdMembers,
  useHouseholds,
  useLeaveHousehold,
  useRemoveHouseholdMember,
  useRenameHousehold,
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

function getUserLabel(user: AppUser): string {
  return user.displayName || user.name || `${user.principalId.slice(0, 10)}…`;
}

interface ConfirmRowProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  confirmLabel?: string;
}

function ConfirmRow({
  message,
  onConfirm,
  onCancel,
  isPending,
  confirmLabel = "Confirm",
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
          data-ocid="hs-confirm.cancel_button"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 h-8 text-xs"
          data-ocid="hs-confirm.confirm_button"
        >
          {isPending ? "Working…" : confirmLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── Section: Household Name ──────────────────────────────────────────────────

function HouseholdNameSection({
  householdId,
  currentName,
}: {
  householdId: string;
  currentName: string;
}) {
  const rename = useRenameHousehold();
  const [name, setName] = useState(currentName);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleSave = () => {
    if (!name.trim() || name.trim() === currentName) return;
    rename.mutate(
      { householdId, newName: name.trim() },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  return (
    <section data-ocid="household-settings.name.section" className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Home className="size-4 text-muted-foreground" />
        <h2 className="font-display font-bold text-base text-foreground">
          Household Name
        </h2>
      </div>
      <div className="bg-card border border-border rounded-xl px-4 py-4 flex flex-col gap-3">
        <Label htmlFor="household-name" className="text-sm font-medium">
          Name
        </Label>
        <div className="flex gap-2">
          <Input
            id="household-name"
            data-ocid="household-settings.name.input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. Andrew & Sarah"
            className="flex-1 bg-secondary border-input"
          />
          <Button
            size="sm"
            data-ocid="household-settings.name.save_button"
            onClick={handleSave}
            disabled={
              rename.isPending || !name.trim() || name.trim() === currentName
            }
            className="h-9 px-3 text-xs shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {rename.isPending ? "Saving…" : saved ? "Saved!" : "Save"}
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Members ─────────────────────────────────────────────────────────

function MembersSection({
  householdId,
  createdBy,
}: {
  householdId: string;
  createdBy: string;
}) {
  const { currentUser } = useAuth();
  const { data: members = [], isLoading } = useHouseholdMembers(householdId);
  const removeHouseholdMember = useRemoveHouseholdMember();
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const isCreator = currentUser?.principalId === createdBy;

  const handleRemove = (principalId: string) => {
    removeHouseholdMember.mutate(principalId, {
      onSuccess: () => setConfirmRemove(null),
    });
  };

  return (
    <section data-ocid="household-settings.members.section" className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Users className="size-4 text-muted-foreground" />
        <h2 className="font-display font-bold text-base text-foreground">
          Members
        </h2>
        {members.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({members.length})
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((user, idx) => {
            const isSelf = user.principalId === currentUser?.principalId;
            const isHouseholdCreator = user.principalId === createdBy;
            const canRemove = isCreator && !isSelf;

            return (
              <div
                key={user.principalId}
                data-ocid={`household-settings.member.item.${idx + 1}`}
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
                      {isHouseholdCreator && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary gap-0.5"
                        >
                          <Crown className="size-2.5" />
                          Creator
                        </Badge>
                      )}
                      {user.role === "admin" && !isHouseholdCreator && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-600 gap-0.5"
                        >
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  {canRemove && (
                    <Button
                      size="sm"
                      variant="ghost"
                      data-ocid={`household-settings.remove.button.${idx + 1}`}
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
                    message={`Remove ${getUserLabel(user)} from this household?`}
                    confirmLabel="Remove"
                    onConfirm={() => handleRemove(user.principalId)}
                    onCancel={() => setConfirmRemove(null)}
                    isPending={removeHouseholdMember.isPending}
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

// ─── Section: Join Requests ───────────────────────────────────────────────────

function JoinRequestsSection({ createdBy }: { createdBy: string }) {
  const { currentUser } = useAuth();
  const { data: requests = [], isLoading } = useHouseholdJoinRequests();
  const approveRequest = useApproveJoinRequest();
  const denyRequest = useDenyJoinRequest();
  const [confirmDeny, setConfirmDeny] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const isCreator = currentUser?.principalId === createdBy;
  if (!isCreator) return null;

  return (
    <section
      data-ocid="household-settings.join-requests.section"
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock className="size-4 text-muted-foreground" />
        <h2 className="font-display font-bold text-base text-foreground">
          Join Requests
        </h2>
        {requests.length > 0 && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
            {requests.length}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div
          data-ocid="household-settings.join-requests.empty_state"
          className="bg-card border border-border rounded-xl px-4 py-5 text-center"
        >
          <CheckCircle2 className="size-7 text-primary/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No pending join requests
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {requests.map((req, idx) => {
            const approved = approvedIds.has(req.id);
            return (
              <div
                key={req.id}
                data-ocid={`household-settings.join-request.item.${idx + 1}`}
                className={`bg-card border rounded-xl px-4 py-3 ${
                  approved ? "border-primary/40 bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {req.requesterName || `${req.requesterId.slice(0, 10)}…`}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      Requested {formatDate(req.createdAt)}
                    </p>
                  </div>
                  {!approved && (
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        data-ocid={`household-settings.join-approve.button.${idx + 1}`}
                        onClick={() =>
                          approveRequest.mutate(req.id, {
                            onSuccess: () =>
                              setApprovedIds((s) => new Set([...s, req.id])),
                          })
                        }
                        disabled={approveRequest.isPending}
                        className="h-8 px-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                      >
                        <UserCheck className="size-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`household-settings.join-deny.button.${idx + 1}`}
                        onClick={() =>
                          setConfirmDeny(confirmDeny === req.id ? null : req.id)
                        }
                        className="h-8 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/5 gap-1"
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
                {confirmDeny === req.id && (
                  <ConfirmRow
                    message={`Deny ${req.requesterName || "this user"}'s request to join?`}
                    confirmLabel="Deny Request"
                    onConfirm={() =>
                      denyRequest.mutate(req.id, {
                        onSuccess: () => setConfirmDeny(null),
                      })
                    }
                    onCancel={() => setConfirmDeny(null)}
                    isPending={denyRequest.isPending}
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

// ─── Section: Leave Household ─────────────────────────────────────────────────

function LeaveHouseholdSection({ householdName }: { householdName: string }) {
  const leaveHousehold = useLeaveHousehold();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLeave = () => {
    leaveHousehold.mutate(undefined, {
      onSuccess: () => setShowConfirm(false),
    });
  };

  return (
    <section data-ocid="household-settings.leave.section" className="mb-6">
      <div className="bg-card border border-destructive/30 rounded-xl px-4 py-4">
        <div className="flex items-start gap-3 mb-3">
          <LogOut className="size-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm text-foreground">
              Leave Household
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              You will need to join or create a new household to use the planner
              and shopping cart.
            </p>
          </div>
        </div>
        {!showConfirm ? (
          <Button
            size="sm"
            variant="destructive"
            data-ocid="household-settings.leave.button"
            onClick={() => setShowConfirm(true)}
            className="w-full h-8 text-xs"
          >
            Leave {householdName}
          </Button>
        ) : (
          <ConfirmRow
            message={`Leave "${householdName}"? You'll need to join or create a new household to use the planner.`}
            confirmLabel="Leave Household"
            onConfirm={handleLeave}
            onCancel={() => setShowConfirm(false)}
            isPending={leaveHousehold.isPending}
          />
        )}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface HouseholdSettingsPageProps {
  onBack: () => void;
}

export default function HouseholdSettingsPage({
  onBack,
}: HouseholdSettingsPageProps) {
  const { currentUser } = useAuth();
  const { data: households = [] } = useHouseholds();

  const household = currentUser?.householdId
    ? households.find((h) => h.id === currentUser.householdId)
    : null;

  if (!currentUser?.householdId) {
    return (
      <div
        className="flex flex-col bg-background min-h-full"
        data-ocid="household-settings.page"
      >
        <div className="sticky top-0 z-30 bg-card border-b border-border px-4 pt-4 pb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-smooth text-muted-foreground hover:text-foreground"
            aria-label="Go back"
            data-ocid="household-settings.back.button"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-display font-bold text-lg text-foreground">
            Household Settings
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <Home className="size-12 text-muted-foreground/40 mb-4" />
          <p className="font-medium text-foreground mb-1">No household yet</p>
          <p className="text-sm text-muted-foreground">
            You are not currently in a household. Go back to join or create one.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={onBack}
            data-ocid="household-settings.no-household.back_button"
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-background min-h-full"
      data-ocid="household-settings.page"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          type="button"
          data-ocid="household-settings.back.button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-muted transition-smooth text-muted-foreground hover:text-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-lg text-foreground leading-tight">
            Household Settings
          </h1>
          {household && (
            <p className="text-xs text-muted-foreground">{household.name}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5 max-w-lg">
        <HouseholdNameSection
          householdId={currentUser.householdId}
          currentName={household?.name ?? ""}
        />
        <MembersSection
          householdId={currentUser.householdId}
          createdBy={household?.createdBy ?? ""}
        />
        <JoinRequestsSection createdBy={household?.createdBy ?? ""} />
        <LeaveHouseholdSection householdName={household?.name ?? "household"} />
      </div>
    </div>
  );
}
