import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { cn, getInitials, isUserOnline } from "../lib/utils";
import { formatTime } from "../lib/format";
import {
  bucketAvCls,
  bucketDotCls,
  bucketOrganBadgeCls,
  SPECIAL_BUCKETS,
} from "../constants/buckets";
import { ROLE_LABELS, roleBadgeCls } from "../constants/roles";
import {
  canAccessAdminPanel,
  canAddTasks,
  canManageNews,
  canSeeAllBuckets,
  isAdmin,
  isDeveloper,
} from "../lib/permissions";
import { Sec } from "../components/ui/Sec";
import { StatusPicker } from "../components/ui/StatusPicker";
import { StatusBadge } from "../components/StatusBadge";
import { PasswordChange } from "../components/PasswordChange";
import { NotificationSettings } from "../components/NotificationSettings";
import { useAppData } from "../context/AppDataContext";

const panelCls =
  "bg-ctrl-panel border border-ctrl-border transition-all duration-[250ms] hover:border-ctrl-border2";

const profileIdInputCls =
  "w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]";

function BucketRow({ label, bucket, isOrgan }) {
  if (!bucket) return null;
  return (
    <div className="flex items-center gap-2.5 py-2 px-2.5 -mx-2.5 bg-ctrl-bg2/40 border border-transparent hover:border-ctrl-border transition-colors">
      <span
        className={cn("w-2 h-2 rounded-full shrink-0", bucketDotCls(bucket))}
      />
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-0.5">
          {label}
        </div>
        <div className="text-[13px] font-medium truncate">{bucket}</div>
      </div>
      {isOrgan && (
        <span
          className={cn(
            "font-mono text-[8px] py-0.5 px-1.5 tracking-[1.5px] uppercase shrink-0 border border-current/25",
            bucketOrganBadgeCls(bucket),
          )}
        >
          ORG
        </span>
      )}
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, setProfile, patchMember } = useAppData();
  const [status, setStatus] = useState(profile.status || "active");
  const [loggingOut, setLoggingOut] = useState(false);
  const [showProfileId, setShowProfileId] = useState(false);
  const [profileIdCopied, setProfileIdCopied] = useState(false);
  const [profileIdAuthOpen, setProfileIdAuthOpen] = useState(false);
  const [profileIdPassword, setProfileIdPassword] = useState("");
  const [profileIdAuthError, setProfileIdAuthError] = useState("");
  const [profileIdAuthLoading, setProfileIdAuthLoading] = useState(false);
  const [profileIdPasswordVisible, setProfileIdPasswordVisible] =
    useState(false);

  useEffect(() => {
    setStatus(profile.status || "active");
  }, [profile.status]);

  const online = isUserOnline(profile.last_seen);
  const [statusSaving, setStatusSaving] = useState(false);

  const permissions = useMemo(
    () =>
      [
        "Dashboard",
        canManageNews(profile.layer) && "Správa oznámení",
        profile.layer !== "pozorovatel" && "Chat v buňce",
        profile.layer !== "pozorovatel" && "Označování úkolů",
        canAddTasks(profile.layer) && "Přidávání úkolů",
        isDeveloper(profile.layer) && "Přidávání úkolů v buňce Developeři",
        canSeeAllBuckets(profile) && "Viditelnost všech buněk",
        isAdmin(profile.layer) && "Admin panel",
        canAccessAdminPanel(profile) &&
          !isAdmin(profile.layer) &&
          "Admin panel — reporty a členové",
        isAdmin(profile.layer) && "Správa všech buněk",
        profile.layer === "pozorovatel" && "Čtení všech buněk",
      ].filter(Boolean),
    [profile.layer, profile.can_see_all_buckets],
  );

  const updateStatus = async (newStatus) => {
    const prev = status;
    setStatus(newStatus);
    setProfile((p) => (p ? { ...p, status: newStatus } : p));
    patchMember(profile.id, { status: newStatus });
    setStatusSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", profile.id);
    setStatusSaving(false);
    if (error) {
      setStatus(prev);
      setProfile((p) => (p ? { ...p, status: prev } : p));
      patchMember(profile.id, { status: prev });
    }
  };

  const activityLabel = online
    ? "Právě na portálu"
    : formatTime(profile.last_seen) === "Nikdy"
      ? "Ještě neaktivní"
      : `Naposledy ${formatTime(profile.last_seen).toLowerCase()}`;

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate("/");
  };

  const copyProfileId = async () => {
    if (!profile.profile_id) return;
    try {
      await navigator.clipboard.writeText(profile.profile_id);
      setProfileIdCopied(true);
      setTimeout(() => setProfileIdCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const closeProfileIdAuth = () => {
    setProfileIdAuthOpen(false);
    setProfileIdPassword("");
    setProfileIdAuthError("");
    setProfileIdPasswordVisible(false);
  };

  const confirmProfileIdAuth = async () => {
    if (!profileIdPassword) {
      setProfileIdAuthError("Zadej heslo");
      return;
    }
    setProfileIdAuthLoading(true);
    setProfileIdAuthError("");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      setProfileIdAuthError("Relace vypršela — přihlas se znovu");
      setProfileIdAuthLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: profileIdPassword,
    });
    setProfileIdAuthLoading(false);
    if (error) {
      setProfileIdAuthError("Heslo je nesprávné");
      return;
    }
    setProfileIdPassword("");
    setProfileIdAuthOpen(false);
    setShowProfileId(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="text-[22px] font-extrabold mb-1">{profile.name}</div>
        <div className="font-mono text-[11px] text-ctrl-accent tracking-[2px] max-[900px]:text-[10px]">
          Tvůj účet v CTRL Europe Team
        </div>
      </div>

      <div className="grid gap-4 grid-cols-[280px_1fr] max-[900px]:grid-cols-1">
        <div className={cn(panelCls, "min-w-0")}>
          <div className="relative px-6 pt-6 pb-5 border-b border-ctrl-border bg-gradient-to-b from-ctrl-panel2/50 to-transparent overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div
                  className={cn(
                    "w-[80px] h-[80px] rounded-full flex items-center justify-center text-[28px] font-bold font-mono shadow-[0_8px_32px_rgba(0,0,0,0.25)]",
                    bucketAvCls(profile.bucket),
                  )}
                >
                  {getInitials(profile.name)}
                </div>
                <StatusBadge
                  status={status}
                  isOnline={online}
                  size="lg"
                  className="absolute bottom-0.5 right-0.5"
                />
              </div>
              <div className="text-lg font-extrabold mb-2 leading-tight">
                {profile.name}
              </div>
              <span
                className={cn(
                  "inline-block font-mono text-[9px] py-1 px-2.5 tracking-[2px] uppercase",
                  roleBadgeCls(profile.layer),
                )}
              >
                {ROLE_LABELS[profile.layer] || profile.layer}
              </span>
              {profile.role && (
                <div className="mt-2 font-mono text-[10px] text-ctrl-text2 tracking-wide">
                  {profile.role}
                </div>
              )}
              <div
                className={cn(
                  "mt-3 font-mono text-[10px] tracking-wide",
                  online ? "text-ctrl-success" : "text-ctrl-text2",
                )}
              >
                {activityLabel}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-1">
            <BucketRow
              label="Buňka"
              bucket={profile.bucket}
              isOrgan={SPECIAL_BUCKETS.includes(profile.bucket)}
            />
            {profile.secondary_bucket && (
              <BucketRow
                label="Sekundární buňka"
                bucket={profile.secondary_bucket}
                isOrgan={SPECIAL_BUCKETS.includes(profile.secondary_bucket)}
              />
            )}

            <div className="h-px bg-ctrl-border my-4" />

            <div>
              <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-2">
                Stav
              </div>
              <StatusPicker
                value={status}
                onChange={updateStatus}
                disabled={statusSaving}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className={cn(panelCls, "p-5 border-b-2 border-b-ctrl-accent")}>
            <Sec>PŘÍSTUPOVÁ PRÁVA</Sec>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-[600px]:grid-cols-1">
              {permissions.map((p) => (
                <div
                  key={p}
                  className="flex items-start gap-2 py-1.5 px-2 -mx-2 rounded-sm hover:bg-ctrl-bg2/30 transition-colors"
                >
                  <span className="text-ctrl-success font-mono text-[11px] mt-0.5 shrink-0">
                    ✓
                  </span>
                  <span className="text-[13px] text-ctrl-text2 leading-snug">
                    {p}
                  </span>
                </div>
              ))}
            </div>
            {profile.profile_id && (
              <div className="mt-4 pt-4 border-t border-ctrl-border">
                <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-2">
                  Moje ID
                </div>
                <p className="text-xs text-ctrl-text2 mb-3 leading-relaxed">
                  Tvé unikátní ID v portálu. Použij ho při akcích, kde tě systém
                  potřebuje identifikovat.
                </p>
                {!showProfileId ? (
                  <button
                    type="button"
                    onClick={() => setProfileIdAuthOpen(true)}
                    className="font-mono text-[9px] tracking-[2px] uppercase py-1.5 px-2.5 border border-ctrl-border text-ctrl-text2 bg-ctrl-bg2/50 transition-colors hover:border-ctrl-accent hover:text-ctrl-accent"
                  >
                    Zobrazit moje ID
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13px] text-ctrl-accent tracking-[3px] py-1.5 px-2.5 bg-ctrl-bg2 border border-ctrl-border">
                      {profile.profile_id}
                    </span>
                    <button
                      type="button"
                      onClick={copyProfileId}
                      className="font-mono text-[9px] tracking-[1.5px] uppercase py-1.5 px-2.5 border border-ctrl-border text-ctrl-text2 transition-colors hover:border-ctrl-accent hover:text-ctrl-accent"
                      title="Kopírovat ID"
                    >
                      {profileIdCopied ? "Zkopírováno" : "Kopírovat"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileId(false);
                        setProfileIdCopied(false);
                      }}
                      className="font-mono text-[9px] tracking-[1.5px] uppercase py-1.5 px-2.5 border border-ctrl-border text-ctrl-text2 transition-colors hover:border-ctrl-text2 hover:text-ctrl-text"
                    >
                      Skrýt
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <PasswordChange />

          <NotificationSettings profile={profile} />

          <div className={cn(panelCls, "p-5")}>
            <Sec>DOKUMENTY SPOLKU</Sec>
            <p className="text-xs text-ctrl-text2 mb-4 leading-relaxed">
              Oficiální dokumenty CTRL Europe Team, z. s. Kliknutím stáhneš
              dokument.
            </p>
            <div className="space-y-0">
              {[
                {
                  name: "Stanovy spolku",
                  desc: "Kompletní stanovy CTRL Europe Team, z. s.",
                  icon: "📋",
                },
                {
                  name: "Zakládací listina",
                  desc: "Zakládací listina spolku",
                  icon: "📄",
                },
                {
                  name: "GDPR — Zásady zpracování osobních údajů",
                  desc: "Jak zpracováváme tvé osobní údaje",
                  icon: "🔒",
                },
                {
                  name: "Členský závazek",
                  desc: "Vzor členského závazku spolku",
                  icon: "✍️",
                },
              ].map((doc, i, arr) => (
                <div
                  key={doc.name}
                  className={cn(
                    "flex items-center gap-3 py-3.5 cursor-default transition-colors hover:bg-ctrl-bg2/25 -mx-2 px-2",
                    i < arr.length - 1 && "border-b border-ctrl-border",
                  )}
                >
                  <span className="w-10 h-10 flex items-center justify-center text-lg bg-ctrl-bg2 border border-ctrl-border shrink-0">
                    {doc.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold mb-0.5">
                      {doc.name}
                    </div>
                    <div className="font-mono text-[10px] text-ctrl-text2 tracking-wide leading-snug">
                      {doc.desc}
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-ctrl-text3 tracking-wide shrink-0 py-1 px-2 border border-ctrl-border bg-ctrl-bg2/50">
                    BRZY
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 pt-3 border-t border-ctrl-border font-mono text-[10px] text-ctrl-text2 tracking-wide leading-relaxed">
              Dokumenty budou k dispozici po finálním podpisu a zápisu spolku.
            </p>
          </div>

          <div className={cn(panelCls, "p-5")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Sec className="!mb-0">ODHLÁŠENÍ</Sec>
                <p className="text-xs text-ctrl-text2 mt-2 leading-relaxed">
                  Ukončíš relaci na portálu. Pro další přístup se znovu
                  přihlásíš.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="shrink-0 border border-ctrl-border bg-transparent text-ctrl-text2 py-1.5 px-3 text-[10px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 hover:border-ctrl-danger hover:text-ctrl-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? "ODHLAŠUJI..." : "ODHLÁSIT SE"}
              </button>
            </div>
          </div>

          <div
            className={cn(
              panelCls,
              "p-5 border-l-2 border-l-ctrl-accent bg-gradient-to-r from-[rgba(42,107,255,0.06)] to-transparent",
            )}
          >
            <Sec>CTRL EUROPE TEAM</Sec>
            <p className="text-[13px] text-ctrl-text2 leading-relaxed">
              CEE Youth Platform zaměřená na digitální hrozby naší generace. AI,
              deepfakes, dezinformace — a proč nás školy nepřipravují.
            </p>
            <blockquote className="mt-4 pt-3 border-t border-ctrl-border font-mono text-[11px] text-ctrl-accent tracking-wide italic">
              "Take control before someone else does."
            </blockquote>
          </div>
        </div>
      </div>

      {profileIdAuthOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-[rgba(0,0,0,0.75)] backdrop-blur-sm max-[900px]:bottom-[70px]"
            onClick={closeProfileIdAuth}
          >
            <div
              className="bg-ctrl-panel border border-ctrl-border rounded-lg w-full max-w-[400px] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative px-6 pt-6 pb-4 border-b border-ctrl-border">
                <button
                  type="button"
                  onClick={closeProfileIdAuth}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded bg-transparent border border-ctrl-border text-ctrl-text2 text-lg leading-none cursor-pointer transition-colors hover:border-ctrl-text2 hover:text-ctrl-text"
                  aria-label="Zavřít"
                >
                  ×
                </button>
                <Sec className="!mb-2">OVĚŘENÍ HESLA</Sec>
                <p className="text-[13px] text-ctrl-text2 leading-relaxed pr-8">
                  Pro zobrazení tvého ID zadej heslo k účtu.
                </p>
              </div>

              <form
                className="px-6 py-5"
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  confirmProfileIdAuth();
                }}
              >
                <div className="mb-4">
                  <div className="font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5">
                    Heslo
                  </div>
                  <div className="relative">
                    <input
                      className={cn(profileIdInputCls, "pr-10")}
                      type={profileIdPasswordVisible ? "text" : "password"}
                      name="profile-id-verification"
                      placeholder="Tvé heslo..."
                      value={profileIdPassword}
                      onChange={(e) => setProfileIdPassword(e.target.value)}
                      autoComplete="off"
                      autoFocus
                      disabled={profileIdAuthLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setProfileIdPasswordVisible((v) => !v)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ctrl-text2 transition-colors hover:text-ctrl-text disabled:opacity-50"
                      aria-label={
                        profileIdPasswordVisible
                          ? "Skrýt heslo"
                          : "Zobrazit heslo"
                      }
                      disabled={profileIdAuthLoading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-[18px] h-[18px]"
                        aria-hidden
                      >
                        {profileIdPasswordVisible ? (
                          <>
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" y1="2" x2="22" y2="22" />
                          </>
                        ) : (
                          <>
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
                {profileIdAuthError && (
                  <div className="text-ctrl-danger font-mono text-[11px] mb-3">
                    // {profileIdAuthError}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={profileIdAuthLoading}
                    className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profileIdAuthLoading ? "OVĚŘUJI..." : "POTVRDIT"}
                  </button>
                  <button
                    type="button"
                    onClick={closeProfileIdAuth}
                    disabled={profileIdAuthLoading}
                    className="py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ZRUŠIT
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
