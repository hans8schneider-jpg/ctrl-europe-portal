import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { cn, getInitials, getLastSeenKind } from "../lib/utils";
import { formatDate, formatTime } from "../lib/format";
import {
  ALL_BUCKETS,
  bucketBarCls,
  bucketMemberAvCls,
} from "../constants/buckets";
import { ROLE_LABELS, roleBadgeCls } from "../constants/roles";
import { lastSeenCls } from "../constants/styles";
import { Sec } from "../components/ui/Sec";
import { MemberModal } from "../components/MemberModal";
import { isAdmin } from "../lib/permissions";
import {
  computeMemberWorkStats,
  computePresenceSummary,
  computeTaskSummary,
  getWarningMembers,
  sortByLoginAsc,
  sortByProductivityDesc,
} from "../lib/adminStats";
import { useAppData } from "../context/AppDataContext";

const REPORT_TYPE_LABELS = { bug: "Chyba", idea: "Nápad" };
const REPORT_TYPE_CLS = {
  bug: "bg-ctrl-danger/20 text-ctrl-danger border-ctrl-danger/40",
  idea: "bg-ctrl-warning/15 text-ctrl-warning border-ctrl-warning/40",
};

const LAYER_FILTER_ORDER = [
  "admin",
  "developer",
  "predsednictvo",
  "zastupce_predsednictva",
  "vedouci",
  "clen",
  "pozorovatel",
];

const filterInputCls =
  "bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)] max-[900px]:w-full max-[900px]:min-w-0";

const filterSelectCls =
  "bg-ctrl-bg2 border border-ctrl-border text-ctrl-text2 py-[9px] px-3 text-xs font-sans outline-none cursor-pointer transition-colors duration-200 focus:border-ctrl-accent min-w-[140px] max-[900px]:w-full max-[900px]:min-w-0";

const statsPanelCls =
  "bg-ctrl-panel border border-ctrl-border p-5 mb-3 max-[900px]:p-3.5 max-[900px]:mb-2.5";

const statCardCls =
  "p-4 bg-ctrl-panel border border-ctrl-border max-[900px]:p-3";

const statValueLgCls =
  "font-mono text-3xl font-bold leading-none mb-1 max-[900px]:text-[26px]";

const statValueMdCls =
  "font-mono text-2xl font-bold leading-none mb-1 max-[900px]:text-[22px]";

const statLabelCls =
  "font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 max-[900px]:text-[8px] max-[900px]:tracking-[1px] max-[900px]:leading-snug";

function StatMetric({ value, label, valueCls, borderCls }) {
  return (
    <div className={cn(statCardCls, "border-b-2", borderCls)}>
      <div className={cn(statValueLgCls, valueCls)}>{value}</div>
      <div className={statLabelCls}>{label}</div>
    </div>
  );
}

function StatMetricSm({ value, label, valueCls }) {
  return (
    <div className={statCardCls}>
      <div className={cn(statValueMdCls, valueCls)}>{value}</div>
      <div className={statLabelCls}>{label}</div>
    </div>
  );
}

function MobileStatPills({ items }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-ctrl-border">
      {items.map((item) => (
        <div key={item.label} className="text-center min-w-0">
          <div
            className={cn(
              "font-mono text-sm font-bold leading-none",
              item.valueCls,
            )}
          >
            {item.value}
          </div>
          <div className="font-mono text-[8px] tracking-[0.5px] uppercase text-ctrl-text3 mt-1 leading-tight">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function MemberStatsCard({ member: m, onSelect, pills, footer }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="p-3.5 bg-ctrl-bg2/30 border border-ctrl-border cursor-pointer transition-colors duration-200 hover:border-ctrl-border2 active:bg-ctrl-bg2/50"
      onClick={() => onSelect(m)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(m);
        }
      }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "w-[32px] h-[32px] flex items-center justify-center text-[11px] font-bold font-mono shrink-0",
            bucketMemberAvCls(m.bucket),
          )}
        >
          {getInitials(m.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold leading-snug truncate">
            {m.name}
          </div>
          <div className="font-mono text-[10px] text-ctrl-text2 mt-0.5 truncate">
            {(m.memberships ?? []).length > 0
              ? (m.memberships ?? []).map((mm) => mm.bucket).join(" + ")
              : m.bucket}
          </div>
          <div className="font-mono text-[9px] text-ctrl-text3 mt-0.5">
            {ROLE_LABELS[m.layer] || m.layer}
          </div>
        </div>
        <div
          className={cn(
            "font-mono text-[10px] shrink-0 text-right max-w-[45%] leading-snug",
            lastSeenCls(getLastSeenKind(m.last_seen)),
          )}
        >
          {formatTime(m.last_seen)}
        </div>
      </div>
      {pills}
      {footer}
    </div>
  );
}

export function AdminPage() {
  const { members, profile, tasks } = useAppData();
  const fullAdmin = isAdmin(profile.layer);
  const [activeTab, setActiveTab] = useState("members");
  const [nameQuery, setNameQuery] = useState("");
  const [bucketFilter, setBucketFilter] = useState("");
  const [layerFilter, setLayerFilter] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "reports") return;
    setReportsLoading(true);
    supabase
      .from("member_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReports(data || []);
        setReportsLoading(false);
      });

    const channel = supabase
      .channel("admin-reports-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "member_reports" },
        (payload) => {
          const row = payload.new;
          if (!row?.id) return;
          setReports((prev) => {
            if (prev.some((r) => String(r.id) === String(row.id))) return prev;
            return [row, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const bucketStats = ALL_BUCKETS.map((bucket) => {
    const bucketMembers = members.filter((m) =>
      (m.memberships ?? []).some((mm) => mm.bucket === bucket),
    );
    const active = bucketMembers.filter(
      (m) => m.last_seen && new Date() - new Date(m.last_seen) < 86400000 * 7,
    );
    return { bucket, total: bucketMembers.length, active: active.length };
  }).filter((s) => s.total > 0);

  const maxActive = Math.max(...bucketStats.map((s) => s.active), 1);

  const presenceSummary = useMemo(
    () => computePresenceSummary(members),
    [members],
  );
  const taskSummary = useMemo(() => computeTaskSummary(tasks), [tasks]);
  const memberWorkStats = useMemo(
    () => computeMemberWorkStats(members, tasks),
    [members, tasks],
  );
  const inactiveByLogin = useMemo(
    () => sortByLoginAsc(memberWorkStats),
    [memberWorkStats],
  );
  const topByProductivity = useMemo(
    () => sortByProductivityDesc(memberWorkStats),
    [memberWorkStats],
  );
  const warningMembers = useMemo(() => getWarningMembers(members), [members]);

  const membersFiltersActive = Boolean(
    nameQuery.trim() || bucketFilter || layerFilter,
  );

  const filteredMembers = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    return members.filter((m) => {
      if (q && !m.name?.toLowerCase().includes(q)) return false;
      if (bucketFilter) {
        const inBucket = (m.memberships ?? []).some((mm) => mm.bucket === bucketFilter);
        if (!inBucket) return false;
      }
      if (layerFilter) {
        const hasLayer =
          m.layer === layerFilter ||
          (m.memberships ?? []).some((mm) => mm.layer === layerFilter);
        if (!hasLayer) return false;
      }
      return true;
    });
  }, [members, nameQuery, bucketFilter, layerFilter]);

  const clearMembersFilters = () => {
    setNameQuery("");
    setBucketFilter("");
    setLayerFilter("");
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-5 max-[900px]:flex-wrap max-[900px]:gap-2 max-[900px]:mb-4">
        <Sec className="!mb-0">ADMIN PANEL</Sec>
        {fullAdmin ? (
          <span className="bg-ctrl-danger text-white font-mono text-[9px] py-0.5 px-2 tracking-wide">
            ADMIN
          </span>
        ) : (
          <span className="bg-ctrl-info text-white font-mono text-[9px] py-0.5 px-2 tracking-wide">
            DEVELOPER
          </span>
        )}
      </div>

      <div className="flex gap-0 mb-5 border-b border-ctrl-border max-[900px]:overflow-x-auto max-[900px]:-mx-4 max-[900px]:px-4 max-[900px]:scrollbar-none">
        <div
          className={cn(
            "py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text shrink-0 max-[900px]:py-2 max-[900px]:px-3 max-[900px]:text-[9px] max-[900px]:tracking-[1px] whitespace-nowrap",
            activeTab === "members" && "text-ctrl-accent border-b-ctrl-accent",
          )}
          onClick={() => setActiveTab("members")}
        >
          ČLENOVÉ ({members.length})
        </div>
        <div
          className={cn(
            "py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text shrink-0 max-[900px]:py-2 max-[900px]:px-3 max-[900px]:text-[9px] max-[900px]:tracking-[1px] whitespace-nowrap",
            activeTab === "stats" && "text-ctrl-accent border-b-ctrl-accent",
          )}
          onClick={() => setActiveTab("stats")}
        >
          STATISTIKY
        </div>
        <div
          className={cn(
            "py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text shrink-0 max-[900px]:py-2 max-[900px]:px-3 max-[900px]:text-[9px] max-[900px]:tracking-[1px] whitespace-nowrap",
            activeTab === "reports" && "text-ctrl-accent border-b-ctrl-accent",
          )}
          onClick={() => setActiveTab("reports")}
        >
          REPORTY
        </div>
        <div
          className={cn(
            "py-2.5 px-5 font-mono text-[10px] tracking-[2px] uppercase cursor-pointer text-ctrl-text2 border-b-2 border-transparent -mb-px transition-all duration-200 hover:text-ctrl-text shrink-0 max-[900px]:py-2 max-[900px]:px-3 max-[900px]:text-[9px] max-[900px]:tracking-[1px] whitespace-nowrap",
            activeTab === "add" && "text-ctrl-accent border-b-ctrl-accent",
          )}
          onClick={() => setActiveTab("add")}
        >
          PŘIDAT ČLENA
        </div>
      </div>

      {activeTab === "members" && (
        <div>
          <div className="flex flex-wrap gap-2.5 mb-3 items-end max-[900px]:flex-col max-[900px]:items-stretch max-[900px]:gap-2">
            <input
              type="search"
              className={cn(
                filterInputCls,
                "flex-1 min-w-[180px] max-[900px]:flex-none",
              )}
              placeholder="Hledat podle jména..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
            <select
              className={filterSelectCls}
              value={bucketFilter}
              onChange={(e) => setBucketFilter(e.target.value)}
            >
              <option value="">Všechny buňky</option>
              {ALL_BUCKETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              className={filterSelectCls}
              value={layerFilter}
              onChange={(e) => setLayerFilter(e.target.value)}
            >
              <option value="">Všechny vrstvy</option>
              {LAYER_FILTER_ORDER.map((layer) => (
                <option key={layer} value={layer}>
                  {ROLE_LABELS[layer]}
                </option>
              ))}
            </select>
            {membersFiltersActive && (
              <button
                type="button"
                className="font-mono text-[10px] tracking-[1px] uppercase text-ctrl-text2 py-[9px] px-3 border border-ctrl-border bg-transparent cursor-pointer transition-colors duration-200 hover:text-ctrl-text hover:border-ctrl-border2 shrink-0 max-[900px]:w-full"
                onClick={clearMembersFilters}
              >
                Zrušit filtry
              </button>
            )}
          </div>
          <div className="font-mono text-[10px] tracking-[1px] uppercase text-ctrl-text3 mb-3">
            {membersFiltersActive
              ? `${filteredMembers.length} z ${members.length} členů`
              : `${members.length} členů`}
          </div>
          {filteredMembers.length === 0 && (
            <p className="text-[13px] text-ctrl-text2 py-6 text-center">
              {membersFiltersActive
                ? "Žádný člen neodpovídá filtrům."
                : "Zatím žádní členové."}
            </p>
          )}
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              className="py-3 px-4 flex items-center gap-3 bg-ctrl-panel border border-ctrl-border mb-2 transition-all duration-200 hover:border-ctrl-border2 cursor-pointer max-[900px]:flex-col max-[900px]:items-stretch max-[900px]:gap-2.5 max-[900px]:py-3.5 max-[900px]:px-3.5"
              onClick={() => setSelectedMember(m)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedMember(m);
                }
              }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 max-[900px]:w-full">
                <div
                  className={cn(
                    "w-[34px] h-[34px] flex items-center justify-center text-xs font-bold font-mono shrink-0",
                    bucketMemberAvCls(m.bucket),
                  )}
                >
                  {getInitials(m.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold leading-snug max-[900px]:text-sm">
                    {m.name}
                  </div>
                  <div className="font-mono text-[10px] text-ctrl-text2 mt-0.5 leading-relaxed max-[900px]:text-[11px] max-[900px]:mt-1">
                    {m.role} ·{" "}
                    {(m.memberships ?? []).length > 0
                      ? (m.memberships ?? []).map((mm) => mm.bucket).join(" + ")
                      : m.bucket}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 max-[900px]:w-full max-[900px]:justify-between max-[900px]:pt-2.5 max-[900px]:border-t max-[900px]:border-ctrl-border">
                <span
                  className={cn(
                    "font-mono text-[9px] py-0.5 px-[7px] tracking-wide uppercase max-[900px]:text-[10px] max-[900px]:px-2",
                    roleBadgeCls(m.layer),
                  )}
                >
                  {ROLE_LABELS[m.layer] || m.layer}
                </span>
                <div
                  className={cn(
                    "font-mono text-[10px] min-w-[120px] text-right max-[900px]:min-w-0 max-[900px]:text-[11px]",
                    lastSeenCls(getLastSeenKind(m.last_seen)),
                  )}
                >
                  {formatTime(m.last_seen)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "stats" && (
        <div>
          <div className="grid grid-cols-4 gap-3 mb-3 max-[900px]:grid-cols-2 max-[900px]:gap-2">
            <StatMetric
              value={presenceSummary.online}
              label="Online teď"
              valueCls="text-ctrl-success"
              borderCls="border-b-ctrl-success"
            />
            <StatMetric
              value={presenceSummary.activeWeek}
              label="Přihlášení 7 dní"
              valueCls="text-ctrl-accent"
              borderCls="border-b-ctrl-accent"
            />
            <StatMetric
              value={presenceSummary.inactive7d}
              label="Neaktivní 7+ dní"
              valueCls="text-ctrl-danger"
              borderCls="border-b-ctrl-danger"
            />
            <StatMetric
              value={presenceSummary.neverLoggedIn}
              label="Nikdy se nepřihlásili"
              valueCls="text-ctrl-warning"
              borderCls="border-b-ctrl-warning"
            />
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3 max-[900px]:grid-cols-2 max-[900px]:gap-2">
            <StatMetricSm
              value={taskSummary.completed7d}
              label="Splněno za 7 dní"
              valueCls="text-ctrl-success"
            />
            <StatMetricSm
              value={taskSummary.completed30d}
              label="Splněno za 30 dní"
              valueCls="text-ctrl-text2"
            />
            <StatMetricSm
              value={taskSummary.created7d}
              label="Nových úkolů 7 dní"
              valueCls="text-ctrl-accent"
            />
            <StatMetricSm
              value={taskSummary.openTotal}
              label="Otevřených úkolů"
              valueCls="text-ctrl-warning"
            />
          </div>

          {warningMembers.length > 0 && (
            <div className={cn(statsPanelCls, "border-ctrl-danger/40")}>
              <Sec className="max-[900px]:!text-[10px] max-[900px]:!tracking-[1.5px]">
                VYŽADUJE POZORNOST — SLABÉ NEBO ŽÁDNÉ PŘIHLÁŠENÍ
              </Sec>
              <p className="text-xs text-ctrl-text2 mb-3 leading-relaxed max-[900px]:text-[11px] max-[900px]:mb-2.5">
                Členové, kteří se 3+ dní nepřihlásili nebo portál nikdy
                neotevřeli.
              </p>
              <div className="space-y-2 max-[900px]:space-y-2">
                {warningMembers.map((m) => (
                  <MemberStatsCard
                    key={m.id}
                    member={m}
                    onSelect={setSelectedMember}
                  />
                ))}
              </div>
            </div>
          )}

          <div className={statsPanelCls}>
            <Sec className="max-[900px]:!text-[10px] max-[900px]:!tracking-[1.5px]">
              PŘIHLÁŠENÍ ČLENŮ — OD NEJMÉNĚ AKTIVNÍCH
            </Sec>

            <div className="max-[900px]:hidden overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="font-mono text-[9px] tracking-[1.5px] uppercase text-ctrl-text3 text-left border-b border-ctrl-border">
                    <th className="py-2 pr-3 font-normal">Člen</th>
                    <th className="py-2 pr-3 font-normal">Buňka</th>
                    <th className="py-2 pr-3 font-normal">Naposledy</th>
                    <th className="py-2 pr-3 font-normal text-right">
                      Splněno 7d
                    </th>
                    <th className="py-2 pr-3 font-normal text-right">
                      Splněno 30d
                    </th>
                    <th className="py-2 pr-3 font-normal text-right">
                      Otevřené
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveByLogin.map(
                    ({
                      member: m,
                      completed7d,
                      completed30d,
                      openAssigned,
                    }) => (
                      <tr
                        key={m.id}
                        className="border-b border-ctrl-border last:border-b-0 cursor-pointer hover:bg-ctrl-bg2/40 transition-colors duration-200"
                        onClick={() => setSelectedMember(m)}
                      >
                        <td className="py-2.5 pr-3">
                          <div className="text-[13px] font-bold">{m.name}</div>
                          <div className="font-mono text-[9px] text-ctrl-text3 mt-0.5">
                            {ROLE_LABELS[m.layer] || m.layer}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-[11px] text-ctrl-text2">
                          {(m.memberships ?? []).find((mm) => mm.is_primary)
                            ?.bucket ?? m.bucket}
                        </td>
                        <td
                          className={cn(
                            "py-2.5 pr-3 font-mono text-[11px]",
                            lastSeenCls(getLastSeenKind(m.last_seen)),
                          )}
                        >
                          {formatTime(m.last_seen)}
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-success">
                          {completed7d}
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-text2">
                          {completed30d}
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-warning">
                          {openAssigned}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="hidden max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-2">
              {inactiveByLogin.map(
                ({ member: m, completed7d, completed30d, openAssigned }) => (
                  <MemberStatsCard
                    key={m.id}
                    member={m}
                    onSelect={setSelectedMember}
                    pills={
                      <MobileStatPills
                        items={[
                          {
                            label: "Splněno 7d",
                            value: completed7d,
                            valueCls: "text-ctrl-success",
                          },
                          {
                            label: "Splněno 30d",
                            value: completed30d,
                            valueCls: "text-ctrl-text2",
                          },
                          {
                            label: "Otevřené",
                            value: openAssigned,
                            valueCls: "text-ctrl-warning",
                          },
                        ]}
                      />
                    }
                  />
                ),
              )}
            </div>
          </div>

          <div className={statsPanelCls}>
            <Sec className="max-[900px]:!text-[10px] max-[900px]:!tracking-[1.5px]">
              PRODUKTIVITA — NEJVÍCE SPLNĚNÝCH ÚKOLŮ (7 DNÍ)
            </Sec>

            <div className="max-[900px]:hidden overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="font-mono text-[9px] tracking-[1.5px] uppercase text-ctrl-text3 text-left border-b border-ctrl-border">
                    <th className="py-2 pr-3 font-normal">Člen</th>
                    <th className="py-2 pr-3 font-normal">Buňka</th>
                    <th className="py-2 pr-3 font-normal text-right">
                      Splněno 7d
                    </th>
                    <th className="py-2 pr-3 font-normal text-right">
                      Splněno 30d
                    </th>
                    <th className="py-2 pr-3 font-normal text-right">Celkem</th>
                    <th className="py-2 pr-3 font-normal text-right">
                      Vytvořeno 7d
                    </th>
                    <th className="py-2 pr-3 font-normal">Naposledy</th>
                  </tr>
                </thead>
                <tbody>
                  {topByProductivity
                    .filter(
                      (row) =>
                        row.completed7d > 0 ||
                        row.completed30d > 0 ||
                        row.created7d > 0,
                    )
                    .slice(0, 15)
                    .map(
                      ({
                        member: m,
                        completed7d,
                        completed30d,
                        completedTotal,
                        created7d,
                      }) => (
                        <tr
                          key={m.id}
                          className="border-b border-ctrl-border last:border-b-0 cursor-pointer hover:bg-ctrl-bg2/40 transition-colors duration-200"
                          onClick={() => setSelectedMember(m)}
                        >
                          <td className="py-2.5 pr-3">
                            <div className="text-[13px] font-bold">
                              {m.name}
                            </div>
                            <div className="font-mono text-[9px] text-ctrl-text3 mt-0.5">
                              {ROLE_LABELS[m.layer] || m.layer}
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-[11px] text-ctrl-text2">
                            {(m.memberships ?? []).find((mm) => mm.is_primary)
                              ?.bucket ?? m.bucket}
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-success font-bold">
                            {completed7d}
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-text2">
                            {completed30d}
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-text3">
                            {completedTotal}
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-[11px] text-right text-ctrl-accent">
                            {created7d}
                          </td>
                          <td
                            className={cn(
                              "py-2.5 pr-3 font-mono text-[11px]",
                              lastSeenCls(getLastSeenKind(m.last_seen)),
                            )}
                          >
                            {formatTime(m.last_seen)}
                          </td>
                        </tr>
                      ),
                    )}
                </tbody>
              </table>
            </div>

            <div className="hidden max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-2">
              {topByProductivity
                .filter(
                  (row) =>
                    row.completed7d > 0 ||
                    row.completed30d > 0 ||
                    row.created7d > 0,
                )
                .slice(0, 15)
                .map(
                  ({
                    member: m,
                    completed7d,
                    completed30d,
                    completedTotal,
                    created7d,
                  }) => (
                    <MemberStatsCard
                      key={m.id}
                      member={m}
                      onSelect={setSelectedMember}
                      pills={
                        <MobileStatPills
                          items={[
                            {
                              label: "Splněno 7d",
                              value: completed7d,
                              valueCls: "text-ctrl-success",
                            },
                            {
                              label: "Splněno 30d",
                              value: completed30d,
                              valueCls: "text-ctrl-text2",
                            },
                            {
                              label: "Celkem",
                              value: completedTotal,
                              valueCls: "text-ctrl-text3",
                            },
                          ]}
                        />
                      }
                      footer={
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-ctrl-border/60">
                          <span className="font-mono text-[9px] uppercase tracking-wide text-ctrl-text3">
                            Vytvořeno 7d
                          </span>
                          <span className="font-mono text-sm font-bold text-ctrl-accent">
                            {created7d}
                          </span>
                        </div>
                      }
                    />
                  ),
                )}
            </div>

            {topByProductivity.every(
              (row) =>
                row.completed7d === 0 &&
                row.completed30d === 0 &&
                row.created7d === 0,
            ) && (
              <p className="text-xs text-ctrl-text2 py-3 max-[900px]:py-2 max-[900px]:text-[11px]">
                Za posledních 30 dní nikdo nesplnil ani nevytvořil úkol.
              </p>
            )}
          </div>

          <div className={statsPanelCls}>
            <Sec className="max-[900px]:!text-[10px] max-[900px]:!tracking-[1.5px]">
              AKTIVITA BUNĚK — POSLEDNÍCH 7 DNÍ
            </Sec>
            {bucketStats.map((s) => (
              <div
                key={s.bucket}
                className="flex items-center gap-3 py-2.5 border-b border-ctrl-border last:border-b-0 max-[900px]:flex-col max-[900px]:items-stretch max-[900px]:gap-2 max-[900px]:py-3"
              >
                <div className="hidden max-[900px]:flex items-center justify-between gap-2 w-full">
                  <div className="text-[13px] font-bold text-ctrl-text">
                    {s.bucket}
                  </div>
                  <div className="font-mono text-[10px] text-ctrl-text2 shrink-0">
                    {s.active}/{s.total} aktivních
                  </div>
                </div>
                <div className="w-[140px] text-xs text-ctrl-text2 shrink-0 max-[900px]:hidden">
                  {s.bucket}
                </div>
                <div className="flex-1 h-1.5 bg-ctrl-border flex gap-px overflow-hidden max-[900px]:w-full max-[900px]:h-2">
                  {Array.from({ length: maxActive }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 h-full min-w-0 transition-colors duration-[600ms]",
                        i < s.active
                          ? bucketBarCls(s.bucket)
                          : "bg-transparent",
                      )}
                    />
                  ))}
                </div>
                <div className="font-mono text-[11px] text-ctrl-text2 min-w-[80px] text-right max-[900px]:hidden">
                  {s.active}/{s.total} aktivních
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div>
          {reportsLoading && (
            <p className="font-mono text-[11px] text-ctrl-text2 tracking-wide">
              Načítám reporty...
            </p>
          )}
          {!reportsLoading && reports.length === 0 && (
            <p className="text-[13px] text-ctrl-text2">
              Zatím žádné reporty od členů.
            </p>
          )}
          {!reportsLoading &&
            reports.map((r) => {
              const author = members.find((m) => m.id === r.author_id);
              return (
                <div
                  key={r.id}
                  className="py-4 px-4 bg-ctrl-panel border border-ctrl-border mb-2 transition-all duration-200 hover:border-ctrl-border2 max-[900px]:py-3.5 max-[900px]:px-3.5"
                >
                  <div className="flex items-start gap-3 flex-wrap mb-2 max-[900px]:gap-2">
                    <span
                      className={cn(
                        "font-mono text-[9px] py-0.5 px-2 tracking-wide uppercase border shrink-0",
                        REPORT_TYPE_CLS[r.type] ||
                          "border-ctrl-border text-ctrl-text2",
                      )}
                    >
                      {REPORT_TYPE_LABELS[r.type] || r.type}
                    </span>
                    {r.title && (
                      <span className="text-[13px] font-bold flex-1 min-w-0 max-[900px]:w-full max-[900px]:text-sm">
                        {r.title}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-ctrl-text2 ml-auto shrink-0 max-[900px]:ml-0 max-[900px]:w-full">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <p className="text-[13px] text-ctrl-text2 leading-relaxed whitespace-pre-wrap mb-2 max-[900px]:text-xs max-[900px]:mb-2.5">
                    {r.message}
                  </p>
                  <div className="font-mono text-[10px] text-ctrl-text3 tracking-wide max-[900px]:text-[9px]">
                  {author ? author.name : "Neznámý člen"}
                  {author?.bucket && ` · ${author.bucket}`}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {activeTab === "add" && (
        <div className="bg-ctrl-panel border border-ctrl-warning p-4 mb-3.5 animate-fade-in max-[900px]:p-3.5">
          <Sec>JAK PŘIDAT ČLENA</Sec>
          <div className="text-xs text-ctrl-text2 leading-[1.8] font-mono max-[900px]:text-[11px] max-[900px]:leading-[1.7]">
            <div className="text-ctrl-warning mb-2">
              Krok 1 — Supabase → Authentication → Users → Add User
            </div>
            <div className="text-ctrl-text2 mb-1">
              Email + heslo + Auto Confirm User ✓
            </div>
            <div className="text-ctrl-text2 mb-4">
              Zkopíruj UUID nového uživatele
            </div>
            <div className="text-ctrl-warning mb-2">
              Krok 2 — Supabase → SQL Editor → vytvoř profil:
            </div>
            <div className="bg-ctrl-bg2 p-3 text-ctrl-success text-[11px] leading-loose border-l-2 border-l-ctrl-accent overflow-x-auto max-[900px]:p-2.5 max-[900px]:text-[10px]">
              INSERT INTO profiles (id, name, role)
              <br />
              VALUES (<br />
              &nbsp;&nbsp;'UUID-sem',
              <br />
              &nbsp;&nbsp;'Jméno Příjmení',
              <br />
              &nbsp;&nbsp;'Role v týmu'
              <br />
              );
            </div>
            <div className="text-ctrl-warning mt-4 mb-2">
              Krok 3 — Přidej členství (opakuj pro každou buňku):
            </div>
            <div className="bg-ctrl-bg2 p-3 text-ctrl-success text-[11px] leading-loose border-l-2 border-l-ctrl-accent overflow-x-auto max-[900px]:p-2.5 max-[900px]:text-[10px]">
              INSERT INTO profile_memberships (profile_id, bucket, layer,
              is_primary)
              <br />
              VALUES (<br />
              &nbsp;&nbsp;'UUID-sem',
              <br />
              &nbsp;&nbsp;'Primární buňka',
              <br />
              &nbsp;&nbsp;'clen', -- vedouci / predsednictvo / zastupce_predsednictva
              <br />
              &nbsp;&nbsp;true -- false pro sekundární buňky
              <br />
              );
            </div>
            <div className="text-ctrl-text2 mt-3 text-[11px]">
              profile_id se přiřadí automaticky (6 znaků). Pokud chybí, spusť
              supabase/profiles-profile-id.sql.
            </div>
            <div className="text-ctrl-text2 mt-1 text-[11px]">
              Globální vrstvy na profiles.layer: admin · developer · pozorovatel
            </div>
            <div className="text-ctrl-text2 mt-0.5 text-[11px]">
              Buňkové vrstvy v profile_memberships.layer: predsednictvo ·
              zastupce_predsednictva · vedouci · clen
            </div>
          </div>
        </div>
      )}

      {selectedMember && (
        <MemberModal
          member={selectedMember}
          tasks={tasks}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
