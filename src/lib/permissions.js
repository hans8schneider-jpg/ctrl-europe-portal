import {
  ALL_BUCKETS,
  SPECIAL_BUCKETS,
  TEAM_BUCKETS,
  bucketOrganBadgeCls,
} from "../constants/buckets";
import { roleBadgeCls } from "../constants/roles";

/** Pořadí membership layer pro odvozování efektivní vrstvy (sestupně). */
const MEMBERSHIP_LAYERS_BY_RANK = [
  "predsednictvo",
  "zastupce_predsednictva",
  "vedouci",
  "clen",
];

/**
 * Vrátí nejvyšší bucket-level layer z pole členství.
 * Používá se pro odvozování efektivní vrstvy u běžných členů.
 */
export const getHighestMembershipLayer = (memberships) => {
  if (!memberships?.length) return null;
  return (
    MEMBERSHIP_LAYERS_BY_RANK.find((l) => memberships.some((m) => m.layer === l)) ??
    null
  );
};

/**
 * Vrátí efektivní layer profilu pro zobrazovací a per-kompatibilní účely.
 * Globální role (admin/developer/pozorovatel) mají přednost.
 * Pro běžné členy se layer odvozuje z nejvyššího členství.
 */
export const getEffectiveLayer = (profile) => {
  if (!profile) return null;
  if (profile.layer) return profile.layer;
  return getHighestMembershipLayer(profile.memberships);
};

/**
 * Vrátí layer uživatele v konkrétní buňce.
 * Null pokud v dané buňce není členem.
 */
export const getLayerInBucket = (profile, bucket) =>
  profile?.memberships?.find((m) => m.bucket === bucket)?.layer ?? null;

/** Předsednictvo apod. v týmové buňce → štítek „Člen · {buňka}" */
const LAYERS_WITH_CLEN_TEAM_MEMBERSHIP = [
  "admin",
  "developer",
  "predsednictvo",
  "zastupce_predsednictva",
];

export const getTeamBucketBadgeDisplay = (memberLayer, bucket) => {
  if (LAYERS_WITH_CLEN_TEAM_MEMBERSHIP.includes(memberLayer)) {
    return { label: `Člen · ${bucket}`, className: roleBadgeCls("clen") };
  }
  return { label: bucket, className: bucketOrganBadgeCls(bucket) };
};

export const DEVELOPERS_BUCKET = "Developeři";

/**
 * Může uživatel přidávat úkoly?
 * Přijímá profil (nebo string layer pro zpětnou kompatibilitu).
 * S konkrétní buňkou provede per-bucket kontrolu přes členství.
 */
export const canAddTasks = (profileOrLayer, bucket = null) => {
  if (typeof profileOrLayer === "string") {
    const layer = profileOrLayer;
    return ["admin", "vedouci", "developer"].includes(layer);
  }
  const profile = profileOrLayer;
  if (!profile) return false;
  const layer = getEffectiveLayer(profile);
  if (["admin", "developer"].includes(layer)) return true;
  const memberships = profile.memberships ?? [];
  if (bucket) {
    return memberships.some((m) => m.bucket === bucket && m.layer === "vedouci");
  }
  return memberships.some((m) => m.layer === "vedouci");
};

/** Sloupec profiles.can_see_all_buckets — vidí všechny buňky (týmové i orgány). */
export const canSeeAllBuckets = (profile) =>
  Boolean(profile?.can_see_all_buckets);

/** Stejný přístup ke všem buňkám jako developer (navigace, stránka buňky). */
export const hasAllTeamBucketAccess = (profile) =>
  getEffectiveLayer(profile) === "developer" || canSeeAllBuckets(profile);

export const canObserveAll = (role) =>
  ["admin", "pozorovatel", "developer"].includes(role);

export const isAdmin = (role) => role === "admin";
export const isDeveloper = (role) => role === "developer";

export const canAccessAdminPanel = (profile) => {
  if (!profile) return false;
  const layer = getEffectiveLayer(profile);
  if (["admin", "developer"].includes(layer)) return true;
  return typeof profile === "object" && canSeeAllBuckets(profile);
};

/** Oznámení na dashboardu (kalendář akcí jen admin) */
export const canManageNews = (role) => ["admin", "developer"].includes(role);

/** Předsednictvo / zástupci / admin vidí organizační buňky na profilech ostatních */
export const canSeeMemberOrganBuckets = (layer) =>
  ["admin", "developer", "predsednictvo", "zastupce_predsednictva"].includes(
    layer,
  );

/** Textová role v buňce (profiles.role) — člen/vedoucí/pozorovatel jen u člena a vedoucího */
export const canSeeMemberBucketRole = (viewerLayer, memberEffectiveLayer) => {
  if (canSeeMemberOrganBuckets(viewerLayer)) return true;
  return ["clen", "vedouci"].includes(memberEffectiveLayer);
};

/** Vrátí všechny buňky profilů z pole členství (nebo fallback na staré pole). */
const profileBucketList = (p) =>
  p?.memberships?.map((m) => m.bucket) ??
  [p?.bucket, p?.secondary_bucket].filter(Boolean);

export const memberSharesBucketWith = (viewer, member) => {
  const viewerBuckets = profileBucketList(viewer);
  const memberBuckets = profileBucketList(member);
  return viewerBuckets.some((b) => memberBuckets.includes(b));
};

/**
 * Textová role v buňce (profiles.role) — ne člen/pozorovatel;
 * vedoucí jen pokud sdílí buňku, kde je skutečně vedoucí.
 */
export const canEditMemberBucketRole = (viewer, member) => {
  if (!viewer || !member || viewer.id === member.id) return false;
  const viewerLayer = getEffectiveLayer(viewer);
  if (["clen", "pozorovatel"].includes(viewerLayer)) return false;
  if (
    ["admin", "developer", "predsednictvo", "zastupce_predsednictva"].includes(
      viewerLayer,
    )
  ) {
    return true;
  }
  if (viewerLayer === "vedouci") {
    // Může editovat role pouze v buňkách, kde je skutečně vedoucí
    const viewerLeaderBuckets = (viewer.memberships ?? [])
      .filter((m) => m.layer === "vedouci")
      .map((m) => m.bucket);
    const memberBuckets = profileBucketList(member);
    return viewerLeaderBuckets.some((b) => memberBuckets.includes(b));
  }
  return false;
};

export function getMemberBucketsForDisplay(member, viewerEffectiveLayer) {
  const allBuckets = profileBucketList(member);
  const teamBuckets = allBuckets.filter((b) => TEAM_BUCKETS.includes(b));
  const organBuckets = allBuckets.filter((b) => SPECIAL_BUCKETS.includes(b));
  const showOrgan = canSeeMemberOrganBuckets(viewerEffectiveLayer);
  const visibleOrgan = showOrgan ? organBuckets : [];
  const visible = [...teamBuckets, ...visibleOrgan];

  const pickAvatarBucket = () => {
    if (teamBuckets.length) return teamBuckets[0];
    if (visibleOrgan.length) return visibleOrgan[0];
    const primary = member.bucket;
    if (primary && !SPECIAL_BUCKETS.includes(primary)) return primary;
    return null;
  };

  return {
    teamBuckets,
    organBuckets: visibleOrgan,
    hasVisibleBuckets: visible.length > 0,
    avatarBucket: pickAvatarBucket(),
  };
}

export const getAccessibleBuckets = (profile) => {
  if (!profile) return [];
  const layer = getEffectiveLayer(profile);
  if (layer === "admin") return ALL_BUCKETS;
  if (layer === "pozorovatel") return TEAM_BUCKETS;

  const memberships = profile.memberships ?? [];
  const buckets = memberships.map((m) => m.bucket);

  // Vedoucí v jakékoli buňce → přístup do Rady zástupců
  if (memberships.some((m) => m.layer === "vedouci")) {
    buckets.push("Rada zástupců");
  }
  // Předsednictvo/developer → přístup do Developeři
  if (
    layer === "developer" ||
    memberships.some((m) =>
      canSeeMemberOrganBuckets(m.layer),
    )
  ) {
    buckets.push("Developeři");
  }
  // Předsednictvo / zástupce → přístup do Předsednictvo
  if (
    memberships.some((m) =>
      ["predsednictvo", "zastupce_predsednictva"].includes(m.layer),
    )
  ) {
    buckets.push("Předsednictvo");
  }

  return [...new Set(buckets)];
};

/** Buňky, které může uživatel otevřít (navigace, stránka buňky). */
export const getBrowsableBuckets = (profile) => {
  if (!profile) return [];
  const layer = getEffectiveLayer(profile);
  if (layer === "admin" || layer === "developer") return ALL_BUCKETS;
  if (hasAllTeamBucketAccess(profile)) return ALL_BUCKETS;
  return getAccessibleBuckets(profile);
};

/** Sekce sidebaru: vlastní týmové buňky, orgány, ostatní týmové buňky (developer). */
export const getSidebarBucketSections = (profile) => {
  const accessible = getAccessibleBuckets(profile);
  const team = accessible.filter((b) => TEAM_BUCKETS.includes(b));
  const organs = hasAllTeamBucketAccess(profile)
    ? SPECIAL_BUCKETS
    : accessible.filter((b) => SPECIAL_BUCKETS.includes(b));
  const others = hasAllTeamBucketAccess(profile)
    ? TEAM_BUCKETS.filter((b) => !team.includes(b))
    : [];
  return { team, organs, others };
};
