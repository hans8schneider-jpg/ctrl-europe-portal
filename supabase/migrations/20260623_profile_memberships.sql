-- =============================================================================
-- MIGRATION: Multi-bucket membership refactor
-- Datum: 2026-06-23
-- Popis: Nahrazení bucket/secondary_bucket/layer na profiles novou tabulkou
--        profile_memberships, kde každý uživatel může být v N buňkách
--        a každé členství má vlastní layer.
-- =============================================================================

-- KROK 1: Vytvoření nové tabulky
-- =============================================================================
CREATE TABLE IF NOT EXISTS profile_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bucket text NOT NULL,
  layer text NOT NULL CHECK (layer IN (
    'predsednictvo',
    'zastupce_predsednictva',
    'vedouci',
    'clen'
  )),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, bucket)
);

-- Zajistí, že každý uživatel má max. jedno primární členství
CREATE UNIQUE INDEX IF NOT EXISTS profile_memberships_one_primary
  ON profile_memberships (profile_id) WHERE is_primary = true;

-- KROK 2: Migrace dat z profiles → profile_memberships
-- =============================================================================

-- Primární buňka (is_primary = true)
-- Uživatelé s layer admin/developer/pozorovatel mají globální roli,
-- jejich bucket-level role se nastaví na 'clen'
INSERT INTO profile_memberships (profile_id, bucket, layer, is_primary)
SELECT
  id,
  bucket,
  CASE
    WHEN layer IN ('admin', 'developer', 'pozorovatel') THEN 'clen'
    ELSE layer
  END,
  true
FROM profiles
WHERE bucket IS NOT NULL
  AND bucket <> 'all'
ON CONFLICT (profile_id, bucket) DO NOTHING;

-- Sekundární buňka (is_primary = false)
-- Layer se přebírá ze stávajícího profilu (bezpečná konzervativní volba).
-- Admin může individuální členství upravit dle potřeby.
INSERT INTO profile_memberships (profile_id, bucket, layer, is_primary)
SELECT
  id,
  secondary_bucket,
  CASE
    WHEN layer IN ('admin', 'developer', 'pozorovatel') THEN 'clen'
    ELSE layer
  END,
  false
FROM profiles
WHERE secondary_bucket IS NOT NULL
ON CONFLICT (profile_id, bucket) DO NOTHING;

-- KROK 3: Vymazat bucket-specifické role z profiles
-- Zachovat pouze globální role: admin, developer, pozorovatel
-- =============================================================================
UPDATE profiles
SET layer = NULL
WHERE layer NOT IN ('admin', 'developer', 'pozorovatel');

-- KROK 4: RLS (Row Level Security)
-- =============================================================================
ALTER TABLE profile_memberships ENABLE ROW LEVEL SECURITY;

-- Každý přihlášený uživatel může číst všechna členství
CREATE POLICY "profile_memberships_select_authenticated"
  ON profile_memberships
  FOR SELECT
  TO authenticated
  USING (true);

-- Pouze admin/developer může zapisovat (INSERT/UPDATE/DELETE)
-- Toto je volitelné — upravte dle svých RLS pravidel
CREATE POLICY "profile_memberships_write_admin"
  ON profile_memberships
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE layer IN ('admin', 'developer')
    )
  );

-- KROK 5: Odebrat staré sloupce z profiles
-- !! SPUSŤTE AŽ PO OVĚŘENÍ, ŽE APP FUNGUJE SPRÁVNĚ !!
-- =============================================================================
-- ALTER TABLE profiles DROP COLUMN IF EXISTS bucket;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS secondary_bucket;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS can_see_all_buckets;

-- Poznámka: can_see_all_buckets se zatím NEODSTRAŇUJE — zůstává jako
-- pomocný příznak pro navigaci.
