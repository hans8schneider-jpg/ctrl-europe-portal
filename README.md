# CTRL Europe Team — Members Portal

## Nasazení na Vercel

### 1. Nahraj na GitHub
1. Jdi na github.com → New repository → název: `ctrl-europe-portal`
2. Nahraj všechny soubory z této složky

### 2. Nastav Vercel
1. Jdi na vercel.com → New Project → Import z GitHubu
2. Vyber repository `ctrl-europe-portal`
3. Před kliknutím Deploy přidej Environment Variables:
   - `REACT_APP_SUPABASE_URL` = https://sevkgwnviddgffkovwba.supabase.co
   - `REACT_APP_SUPABASE_ANON_KEY` = (tvůj anon key)
4. Klikni Deploy

### 3. Přidávání členů
1. Supabase → Authentication → Users → Add User (zadej email + heslo)
2. Zkopíruj UUID nového uživatele
3. SQL Editor → spusť:
```sql
INSERT INTO profiles (id, name, role, bucket, layer)
VALUES ('UUID-sem', 'Jméno Příjmení', 'Role v týmu', 'Buňka', 'core');
```

### Vrstvy členů
- `admin` — plný přístup, vidí vše
- `core` — jádro týmu
- `extended` — rozšířený tým  
- `community` — komunita

### Buňky
- PR a komunikace
- Sociální sítě
- Podcast
- Research
- Grafika
- Video
- Mezinárodní
- Eventy
- all (vidí vše — pro admin)
