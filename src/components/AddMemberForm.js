import { useState } from "react";
import { supabase } from "../supabase";
import { ALL_BUCKETS, SPECIAL_BUCKETS } from "../constants/buckets";
import { ROLE_LABELS } from "../constants/roles";
import { Sec } from "./ui/Sec";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GLOBAL_LAYERS = [
  { value: "", label: "Běžný člen (vrstva z buňky)" },
  { value: "admin", label: "Admin" },
  { value: "developer", label: "Developer" },
  { value: "pozorovatel", label: "Pozorovatel" },
];

const BUCKET_LAYERS = [
  "predsednictvo",
  "zastupce_predsednictva",
  "vedouci",
  "clen",
];

const inputCls =
  "w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text py-[9px] px-3 text-[13px] font-sans outline-none transition-all duration-200 focus:border-ctrl-accent focus:shadow-[0_0_0_2px_rgba(42,107,255,0.1)]";

const selectCls =
  "w-full bg-ctrl-bg2 border border-ctrl-border text-ctrl-text2 py-[9px] px-3 text-xs font-sans outline-none cursor-pointer transition-colors duration-200 focus:border-ctrl-accent";

const labelCls =
  "font-mono text-[9px] tracking-[2px] uppercase text-ctrl-text2 mb-1.5 block";

let membershipKeyCounter = 0;
function newMembershipRow() {
  membershipKeyCounter += 1;
  return { key: membershipKeyCounter, bucket: "", layer: "clen" };
}

const INITIAL_FORM = {
  authUserId: "",
  name: "",
  role: "",
  globalLayer: "",
};

function layerOptionsForBucket(bucket) {
  if (SPECIAL_BUCKETS.includes(bucket)) return BUCKET_LAYERS;
  return ["clen", "vedouci"];
}

export function AddMemberForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [memberships, setMemberships] = useState([newMembershipRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isAdminLayer = form.globalLayer === "admin";
  const needsMembership = !isAdminLayer;

  const clearFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearFeedback();
  };

  const updateMembership = (key, patch) => {
    setMemberships((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const next = { ...row, ...patch };
        if (patch.bucket !== undefined) {
          const allowed = layerOptionsForBucket(patch.bucket);
          if (!allowed.includes(next.layer)) next.layer = "clen";
        }
        return next;
      }),
    );
    clearFeedback();
  };

  const removeMembership = (key) => {
    setMemberships((prev) => prev.filter((row) => row.key !== key));
    clearFeedback();
  };

  const addMembershipRow = () => {
    setMemberships((prev) => [...prev, newMembershipRow()]);
    clearFeedback();
  };

  const usedBuckets = memberships.map((m) => m.bucket).filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const authUserId = form.authUserId.trim();
    const name = form.name.trim();
    const role = form.role.trim();

    if (!UUID_RE.test(authUserId)) {
      setError("UUID musí být platný formát (např. z Authentication → Users).");
      return;
    }
    if (!name) {
      setError("Vyplň jméno.");
      return;
    }
    if (!role) {
      setError("Vyplň roli v týmu.");
      return;
    }

    const filledMemberships = memberships.filter((m) => m.bucket);
    if (needsMembership && filledMemberships.length === 0) {
      setError("Vyber alespoň jednu buňku.");
      return;
    }
    if (needsMembership && memberships.some((m) => !m.bucket)) {
      setError("Vyplň buňku u každého řádku, nebo ho odeber.");
      return;
    }
    if (new Set(filledMemberships.map((m) => m.bucket)).size !== filledMemberships.length) {
      setError("Každá buňka může být vybrána jen jednou.");
      return;
    }

    setSubmitting(true);

    const primaryBucket = filledMemberships[0]?.bucket ?? "all";
    const profileRow = {
      id: authUserId,
      name,
      role,
      bucket: isAdminLayer ? "all" : primaryBucket,
      layer: form.globalLayer || null,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .insert([profileRow]);

    if (profileError) {
      setSubmitting(false);
      if (profileError.code === "23505") {
        setError("Profil s tímto UUID už existuje.");
        return;
      }
      if (profileError.code === "23503") {
        setError(
          "UUID neexistuje v Authentication — nejdřív vytvoř uživatele v Supabase dashboardu.",
        );
        return;
      }
      if (profileError.code === "42501" || profileError.message?.includes("policy")) {
        setError("Vytvoření zablokovalo oprávnění v databázi.");
        return;
      }
      setError(profileError.message || "Vytvoření profilu se nepovedlo.");
      return;
    }

    if (needsMembership) {
      const membershipRows = filledMemberships.map((m, index) => ({
        profile_id: authUserId,
        bucket: m.bucket,
        layer: m.layer,
        is_primary: index === 0,
      }));

      const { error: membershipError } = await supabase
        .from("profile_memberships")
        .insert(membershipRows);

      if (membershipError) {
        await supabase.from("profiles").delete().eq("id", authUserId);
        setSubmitting(false);
        setError(
          membershipError.message ||
            "Profil vytvořen, ale členství se nepodařilo uložit — profil byl smazán.",
        );
        return;
      }
    }

    setSubmitting(false);
    setSuccess(`${name} byl/a úspěšně přidán/a do portálu.`);
    setForm(INITIAL_FORM);
    setMemberships([newMembershipRow()]);
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setMemberships([newMembershipRow()]);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-ctrl-panel border border-ctrl-warning p-4 mb-4 max-[900px]:p-3.5">
        <Sec>KROK 1 — AUTHENTICATION</Sec>
        <p className="text-xs text-ctrl-text2 leading-relaxed font-mono max-[900px]:text-[11px]">
          Uživatele nejdřív vytvoř v{" "}
          <span className="text-ctrl-warning">Supabase → Authentication → Users → Add User</span>
          {" "}(email, heslo, Auto Confirm User ✓). Zkopíruj jeho UUID a vlož níže.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-ctrl-panel border border-ctrl-border p-5 max-[900px]:p-3.5"
      >
        <Sec>KROK 2 — PROFIL A ČLENSTVÍ</Sec>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="add-member-uuid">
              UUID z Authentication *
            </label>
            <input
              id="add-member-uuid"
              className={inputCls}
              value={form.authUserId}
              onChange={(e) => setField("authUserId", e.target.value)}
              placeholder="4cdd03f6-3ea6-437d-9351-b84b5349e221"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="add-member-name">
              Jméno *
            </label>
            <input
              id="add-member-name"
              className={inputCls}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Jméno Příjmení"
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="add-member-role">
              Role v týmu *
            </label>
            <input
              id="add-member-role"
              className={inputCls}
              value={form.role}
              onChange={(e) => setField("role", e.target.value)}
              placeholder="Vedoucí Podcast"
            />
          </div>

          <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
            <label className={labelCls} htmlFor="add-member-global-layer">
              Globální vrstva
            </label>
            <select
              id="add-member-global-layer"
              className={selectCls}
              value={form.globalLayer}
              onChange={(e) => setField("globalLayer", e.target.value)}
            >
              {GLOBAL_LAYERS.map((opt) => (
                <option key={opt.value || "member"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {needsMembership ? (
          <div className="mt-5 pt-5 border-t border-ctrl-border">
            <div className={labelCls}>Členství v buňkách *</div>
            <p className="font-mono text-[10px] text-ctrl-text3 mb-3 leading-relaxed">
              První buňka je primární. U týmových buněk lze zvolit vrstvu člen nebo vedoucí.
            </p>

            <div className="flex flex-col gap-2.5">
              {memberships.map((row, index) => (
                <div
                  key={row.key}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_28px] gap-2 items-end"
                >
                  <div>
                    {index === 0 && (
                      <span className="font-mono text-[8px] tracking-[1px] uppercase text-ctrl-accent mb-1 block">
                        Primární
                      </span>
                    )}
                    <select
                      className={selectCls}
                      value={row.bucket}
                      onChange={(e) =>
                        updateMembership(row.key, { bucket: e.target.value })
                      }
                    >
                      <option value="">— vyber buňku —</option>
                      {ALL_BUCKETS.filter(
                        (b) => b === row.bucket || !usedBuckets.includes(b),
                      ).map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    {index === 0 && (
                      <span className="font-mono text-[8px] tracking-[1px] uppercase text-ctrl-text3 mb-1 block sm:invisible">
                        Vrstva
                      </span>
                    )}
                    <select
                      className={selectCls}
                      value={row.layer}
                      onChange={(e) =>
                        updateMembership(row.key, { layer: e.target.value })
                      }
                    >
                      {layerOptionsForBucket(row.bucket).map((layer) => (
                        <option key={layer} value={layer}>
                          {ROLE_LABELS[layer]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {index > 0 ? (
                    <button
                      type="button"
                      className="w-7 h-[34px] flex items-center justify-center text-ctrl-text3 border border-ctrl-border text-sm leading-none transition-colors hover:border-ctrl-danger hover:text-ctrl-danger"
                      title="Odebrat buňku"
                      onClick={() => removeMembership(row.key)}
                    >
                      ×
                    </button>
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                </div>
              ))}
            </div>

            {memberships.length < ALL_BUCKETS.length && (
              <button
                type="button"
                className="mt-3 font-mono text-[9px] tracking-[1.5px] uppercase py-1 px-2 text-ctrl-text3 border border-dashed border-ctrl-border transition-colors hover:border-ctrl-accent hover:text-ctrl-accent"
                onClick={addMembershipRow}
              >
                + Přidat další buňku
              </button>
            )}
          </div>
        ) : (
          <p className="font-mono text-[11px] text-ctrl-text3 mt-4 leading-relaxed">
            Admin účty nemají buňkové členství — bucket se nastaví na „all“.
          </p>
        )}

        {error && (
          <p className="font-mono text-[11px] text-ctrl-danger mt-4 tracking-wide">
            {error}
          </p>
        )}
        {success && (
          <p className="font-mono text-[11px] text-ctrl-success mt-4 tracking-wide">
            {success}
          </p>
        )}

        <div className="flex flex-wrap gap-2.5 mt-5">
          <button
            type="submit"
            disabled={submitting}
            className="border-0 py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-ctrl-accent text-white hover:bg-ctrl-accent2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "PŘIDÁVÁM..." : "PŘIDAT ČLENA"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={resetForm}
            className="py-[9px] px-[18px] text-[11px] font-bold tracking-[2px] uppercase cursor-pointer font-sans transition-all duration-200 bg-transparent border border-ctrl-border text-ctrl-text2 hover:border-ctrl-text2 hover:text-ctrl-text disabled:opacity-50 disabled:cursor-not-allowed"
          >
            VYMAZAT
          </button>
        </div>

        <p className="font-mono text-[10px] text-ctrl-text3 mt-4 leading-relaxed">
          Veřejné profile_id (6 znaků) se přiřadí automaticky.
        </p>
      </form>
    </div>
  );
}
