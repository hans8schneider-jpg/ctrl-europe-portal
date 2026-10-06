# Newsletter — odesílání z portálu

Člověk, který tohle zadání zadává, má jen základní zkušenost s vibecodingem. Kód píšeš ty. Jeho zastav jen tam, kde musí kliknout v cizím účtu nebo něco vyzkoušet očima. V těch místech mu napiš přesný postup z části **Zastávky**. Nepožaduj po něm, aby vymýšlel architekturu, psal SQL, sahal do kódu nebo rozhodoval, jak to zabezpečit.

Neměň pravidla v tomhle souboru. Když narazíš na chybu, oprav ji sám. Člověku řekni jednou větou, co se stalo a co má udělat on, ne aby to ladil v kódu.

Tohle je druhá část newsletteru. První část (přihlášení, odhlášení, tabulka odběratelů) žije na veřejném webu a do tohohle repozitáře nepatří. Tady vznikne stránka, ze které admin skládá vzhled mailu jako šablonu a odešle ho jedné skupině odběratelů. Veřejný web neměň. Do portálu nepřidávej přihlašovací formulář pro veřejnost ani stránku odhlášení.

## Co už v projektech je

Portál je Create React App (`react-scripts`), React 18, React Router 6, Tailwind. Celá aplikace je až za přihlášením (`src/App.js`, `supabase.auth.signInWithPassword`). Prohlížeč mluví se Supabase jen přes `src/supabase.js` a proměnné `REACT_APP_SUPABASE_URL` a `REACT_APP_SUPABASE_ANON_KEY`. Složka `api/` tu není. Cokoli, co potřebuje tajný klíč, je Supabase Edge Function. Vzor je `supabase/functions/send-push/index.ts`, ale ten vzor nekopíruj slepě: `send-push` má v `supabase/config.toml` `verify_jwt = false`, protože ho volá webhook. Newsletter tak nesmí být.

Admin v tomhle zadání znamená jen `profiles.layer === 'admin'`. V kódu je to `admin` z `useAppData()` (`isAdmin` v `src/lib/permissions.js`). `adminPanelAccess` je širší: vidí ho i developer a člověk s `can_see_all_buckets`. Ti newsletter posílat nesmí a odkaz na něj nevidí.

Buňky (PR a komunikace, Research, Předsednictvo a další) jsou interní týmy. Nejsou to skupiny newsletteru a e-mail jim neposílej.

Odběratelé jsou v tabulce `newsletter_subscribers` ve stejném Supabase projektu, ke kterému je portál už připojený. Veřejný web do ní zapisuje svým serverem. Sloupce, které smíš číst: `email`, `preferences`, `lang`, `status`, `unsubscribe_token`. Povolené skupiny v `preferences`: `news`, `workshops`, `summit`, `run`. `status` je `subscribed` nebo `unsubscribed`. `lang` je `cs` nebo `en`. Řádek z téhle funkce neupravuj. Token neměň. Nový Supabase projekt nezakládej.

Odhlášení už umí veřejný web. V šabloně je značka `{{unsubscribe_url}}`. Při odeslání ji funkce nahradí adresou `{SITE_URL}/newsletter/unsubscribe?token={unsubscribe_token}` toho příjemce. Výchozí `SITE_URL` je `https://ctrleurope.com`. V odkazu nikdy není `/api/` a nikdy adresa portálu.

Resend už posílá maily z veřejného webu. Nový Resend účet nezakládej. Odesílatel je proměnná `RESEND_FROM_EMAIL`, a když chybí, `CTRL Europe <noreply@ctrleurope.com>`.

## Co má vzniknout

Admin otevře `/newsletter`. Na záložce Šablony vytvoří šablonu, upraví ji ve vizuálním editoru a ve zdrojovém HTML a uloží. Na záložce Odeslat vybere uloženou šablonu a jednu skupinu. Nejdřív vidí jen počet příjemců. Může poslat zkoušku na jednu adresu, která v té skupině je. Celou skupinu odešle až po zaškrtnutí potvrzení. Šablony, počet, zkoušku i odeslání dělá Edge Function `send-newsletter`. Prohlížeč tabulku odběratelů nečte a jejich adresy nikdy nedostane. Odeslání si HTML nebere z prohlížeče, ale z uložené šablony.

Vzhled stránky drž u admin stránky: tmavý panel, `Sec`, mono popisky, stávající inputy a tlačítka (`bg-ctrl-panel`, `bg-ctrl-bg2`, `border-ctrl-border`, `text-ctrl-accent`). Texty jen česky. Portál nemá přepínač jazyka. Framer Motion nepřidávej. Vlastní CSS soubor pro stránku nezakládej. CSS editoru z knihovny GrapesJS naimportuj, jinak se editor nerozloží.

## Soubory

Vytvoř nebo uprav jen tohle:

| soubor | co |
|---|---|
| `src/pages/NewsletterSendPage.js` | záložky Šablony a Odeslat |
| `src/components/NewsletterTemplateEditor.js` | vizuální editor a zdroj HTML |
| `src/App.js` | route `newsletter`, jen pro `admin` |
| `src/components/layout/AppLayout.js` | odkaz Newsletter v sidebaru, jen když `admin` |
| `src/components/MobileBottomNav.js` | stejný odkaz ve vysouvacím menu, ne ve spodní liště |
| `supabase/functions/send-newsletter/index.ts` | šablony, ověření admina, výběr příjemců, Resend |
| `supabase/config.toml` | `[functions.send-newsletter]` s `verify_jwt = true` |
| `package.json` | `grapesjs` a `grapesjs-preset-newsletter` (`npm install`) |

`send-push` neupravuj. `src/supabase.js` neupravuj. Do `AppDataContext` tabulku odběratelů ani šablon nepřidávej. `.env` a `.env.example` nerozšiřuj o Resend ani o service role. Závislost na Resend do `package.json` nepřidávej, maily posílej přes `fetch` stejně jako `send-push` volá web-push.

## Tabulky

`newsletter_subscribers` nevytvářej znovu a nepřidávej k ní policy.

SQL nespouštěj sám. V zastávce 1 ho dej člověku zkopírovat.

```sql
create table newsletter_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null default '',
  html text not null,
  created_by uuid not null references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_templates_name_len check (char_length(btrim(name)) between 1 and 80),
  constraint newsletter_templates_subject_len check (char_length(subject) <= 120),
  constraint newsletter_templates_html_len check (char_length(html) between 1 and 100000)
);

alter table newsletter_templates enable row level security;

create table newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sent_by uuid not null references profiles(id),
  template_id uuid,
  template_name text not null,
  mode text not null,
  group_key text not null,
  subject text not null,
  recipient_count int not null,
  sent_count int not null default 0,
  failed_count int not null default 0,
  constraint newsletter_sends_mode check (mode in ('test', 'send')),
  constraint newsletter_sends_group check (group_key in ('news', 'workshops', 'summit', 'run'))
);

alter table newsletter_sends enable row level security;
```

Žádnou policy pro `anon` ani `authenticated` nepřidávej. Čte a zapisuje jen Edge Function přes service role. Do `newsletter_sends` neukládej seznam adres, tokeny ani HTML mailu. `template_id` nech bez cizího klíče, ať smazení šablony nesmaže historii. `template_name` je název v okamžiku odeslání.

## Stránka

Route v `src/App.js` pod `AppLayout`, vedle `admin`. Obal ji stejně jako `AdminRoute`, ale pusť dál jen když `admin` z `useAppData()` je true. Jinak `Navigate` na `/`. Developer, který vidí Admin, na `/newsletter` skončí na dashboardu.

V `NAV_MAIN` přidej položku Newsletter. Podmínku nevěš na `adminPanelAccess`. Odkaz vykresli jen když je `admin`. Ve spodní mobilní liště ho nepřidávej, lišta je plná. Do vysouvacího menu, do bloku Portál nad Report, přidej řádek Newsletter se stejným cílem, zase jen pro `admin`. Po kliknutí menu zavři. Do `PAGE_TITLES` dej `/newsletter`: `Newsletter`.

Dvě záložky ve stejném stylu jako záložky na admin stránce: **Šablony** a **Odeslat**.

### Šablony

Seznam uložených šablon: název, předmět, datum poslední úpravy. Tlačítko „Nová šablona“ otevře editor s výchozím HTML z části **Výchozí šablona**. Klik na řádek otevře tu šablonu v editoru. Tlačítka editoru: „Uložit“ a u existující šablony „Smazat“. Smazání se zeptá větou „Smazat šablonu {název}?“ a až potom smaže. Rozepsanou neuloženou šablonu při odchodu ze záložky nezahazuj potichu: když jsou neuložené změny, napiš „Máš neuložené změny.“ a nech ho uložit, nebo změny zahodit.

Editor je `src/components/NewsletterTemplateEditor.js`. Nad ním pole Název a Předmět. Pod nimi přepínač **Vzhled** a **HTML**. Oba režimy upravují jeden řetězec. Co se změní v jednom, po přepnutí uvidí ve druhém.

**Vzhled.** GrapesJS s presetem `grapesjs-preset-newsletter`. Editor inicializuj v `useEffect` a při odmontování ho znič. Lištu GrapesJS nech v češtině tam, kde preset má vlastní text; zbytek nepřekládej, když na to preset nemá háček. Bloky, které admin ve vzhledu použije, jsou bloky toho presetu (text, obrázek, tlačítko, oddělovač, sloupce). Navíc do lišty dej vlastní tlačítko „Odhlášení“, které do plátna vloží odkaz:

```html
<a href="{{unsubscribe_url}}">Odhlásit odběr</a>
```

Náhled v editoru nesmí značku nahradit živým tokenem. `href` v uloženém HTML zůstane `{{unsubscribe_url}}`.

**HTML.** Textarea s celým zdrojovým HTML, `font-mono`, bílé místo zachovat. Po přepnutí z Vzhledu do HTML do ní vlož HTML s inline styly příkazem presetu `gjs-get-inlined-html`. Po přepnutí z HTML zpátky na Vzhled ten text naimportuj do editoru. Když import selže, nech člověka v režimu HTML, šablonu nepřepisuj prázdným dokumentem a na stránce ukaž „Tohle HTML se nepodařilo otevřít ve vzhledu. Uprav zdroj, nebo ho vrať.“

Uložení pošle název, předmět a HTML z právě otevřeného režimu (u Vzhledu z `gjs-get-inlined-html`). Prázdný název, prázdný předmět nebo prázdné HTML neukládej.

### Odeslat

1. Výběr uložené šablony. V seznamu je název a předmět. Bez vybrané šablony nejdou count, zkouška ani odeslání.
2. Náhled vybrané šablony v `iframe` s `sandbox=""` (bez skriptů) a `srcDoc`. V náhledu nahraď `{{unsubscribe_url}}` za `#`, ať odkaz nic nevolá. Token do náhledu nedávej.
3. Výběr jedné skupiny. Viditelné názvy: Aktuality, Workshopy, Summit, CTRL Run. Hodnoty posílané funkci: `news`, `workshops`, `summit`, `run`.
4. Tlačítko „Spočítat příjemce“.
5. Po úspěšném počtu věta „V této skupině je N přihlášených.“ a zaškrtávátko „Odesílám tuto šablonu celé skupině.“ Tlačítko „Odeslat skupině“ je do té doby vypnuté.
6. Zkušební adresa a tlačítko „Poslat zkoušku“. Zkouška nepotřebuje zaškrtnuté potvrzení hromadného odeslání.
7. Pod tím seznam posledních odeslání: datum, název šablony, skupina, předmět, režim Zkouška nebo Skupina, počty. E-maily příjemců tam nejsou.

Když člověk změní šablonu nebo skupinu, počet zahoď, zaškrtávátko vypni a „Odeslat skupině“ znovu zablokuj. Tlačítka během requestu zablokuj, ať neodejde druhý klik. Předmět na téhle záložce needituje. Chce-li ho změnit, uloží ho v šabloně.

Volání:

```js
supabase.functions.invoke('send-newsletter', { body })
```

Session už v klientovi je. Ruční `Authorization` neskládej a service role do prohlížeče nedávej. Šablony nečti přes `supabase.from('newsletter_templates')`.

Těla:

```json
{ "action": "templates" }
```

```json
{ "action": "template_create", "name": "Pozvánka", "subject": "Summit je otevřený", "html": "<table>...</table>" }
```

```json
{ "action": "template_update", "id": "<uuid>", "name": "Pozvánka", "subject": "Summit je otevřený", "html": "<table>...</table>" }
```

```json
{ "action": "template_delete", "id": "<uuid>" }
```

```json
{ "action": "count", "templateId": "<uuid>", "group": "news" }
```

Zkouška je `action: "test"`, `templateId`, `group` a `testEmail`. Skupina je `action: "send"`, `templateId`, `group` a `"confirm": true`. Historie je `{ "action": "history" }`.

Odpověď `templates` je `{ "ok": true, "templates": [ { "id", "name", "subject", "html", "updated_at" } ] }`. Jiná akce seznam odběratelů nevrací.

| situace | věta na stránce |
|---|---|
| šablona uložena | Šablona uložena. |
| šablona smazána | Šablona smazána. |
| počet se nepodařil | Počet se nepodařilo zjistit. Zkuste to znovu. |
| v šabloně chybí odhlášení | V šabloně chybí odkaz pro odhlášení. |
| zkouška odeslána | Zkouška odeslána. |
| adresa v té skupině není | Tahle adresa v této skupině není přihlášená. |
| skupina odeslána a část selhala | Odesláno. Část se nepodařila. |
| skupina odeslána bez chyb | Odesláno. |
| jiná chyba | Nepodařilo se odeslat. Zkuste to znovu. |

U „Část se nepodařila“ ukaž jen čísla `sent` a `failed`, ne adresy. Když je `failed` nula, ukaž jen „Odesláno.“

## Výchozí šablona

Nová šablona začíná tímto HTML. Admin ho může ve vzhledu i ve zdroji celé přepsat. Značku `{{unsubscribe_url}}` ve výchozím stavu nech.

```html
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f3;width:100%;">
  <tr>
    <td align="center" style="padding:40px 20px 48px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#0b1020;padding:28px 32px 24px;">
            <p style="margin:0 0 8px;font-family:Geist Mono,Consolas,monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8ea0c8;">CTRL Europe</p>
            <h1 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:28px;line-height:1.15;font-weight:800;color:#f5f5f3;">Nadpis</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:32px;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.5;color:#0b1020;">
            <p style="margin:0 0 16px;">Text mailu.</p>
            <p style="margin:24px 0 0;font-size:13px;color:#5c6578;"><a href="{{unsubscribe_url}}" style="color:#1d4ed8;">Odhlásit odběr</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

## Edge Function

`supabase/functions/send-newsletter/index.ts`. V `supabase/config.toml` přidej blok a u `send-push` nech `verify_jwt = false`, jak je:

```toml
[functions.send-newsletter]
verify_jwt = true
```

Funkce bere POST a OPTIONS, jinak 405. `OPTIONS` vrať s CORS hlavičkami. `Access-Control-Allow-Origin` nastav na `Origin` požadavku jen když je to `http://localhost:3000` nebo `https://ctrl-europe-portal.vercel.app`. Jiný Origin odmítej. Hvězdičku nedávej.

Postup u každého POST:

1. Z hlavičky `Authorization` vezmi JWT. Přes service role zavolej `auth.getUser(jwt)`. Bez uživatele vrať 401 a `{ "error": "Unauthorized" }`.
2. Načti `profiles.layer` pro `user.id`. Pustit dál smí jen hodnota `admin`. Developer, vedoucí i kdokoli jiný dostane 403 a `{ "error": "Forbidden" }`. Vrstvu neodvozuj z členství v buňce.
3. `action` musí být `templates`, `template_create`, `template_update`, `template_delete`, `count`, `test`, `send` nebo `history`. Jinak 400.

### Šablony

`templates` vrať všechny řádky se sloupci `id`, `name`, `subject`, `html`, `updated_at`, seřazené podle `updated_at` sestupně.

`template_create` a `template_update` vyžadují název po oříznutí 1 až 80 znaků, předmět po oříznutí 1 až 120 znaků a HTML délky 1 až 100000 znaků. `template_update` a `template_delete` vyžadují `id` ve tvaru UUID. Neznámé id vrať 404 s `{ "error": "not_found" }`.

Před zápisem HTML vyčisti, v prohlížeči se na to nespoléhej:

- smaž značky `script`, `iframe`, `object`, `embed`, `form`, `link`, `meta`
- smaž atributy začínající `on`
- smaž `href` a `src`, které nezačínají na `https://`, `http://`, `mailto:` nebo nejsou přesně `{{unsubscribe_url}}` (u `href`)
- `{{unsubscribe_url}}` v textu nech. Skutečný unsubscribe token do šablony nepiš, i kdyby ho tělo obsahovalo. Když v HTML najdeš `/newsletter/unsubscribe?token=`, ten query parametr `token` vyhoď

Po vytvoření vrať `{ "ok": true, "template": { "id", "name", "subject", "html", "updated_at" } }`. Po úpravě totéž. Po smazání `{ "ok": true }`.

### Odeslání

`count`, `test` a `send` vyžadují `templateId` (UUID existující šablony) a `group` (jedna ze čtyř skupin). HTML ani předmět z těla požadavku nepoužívej. Načti je z řádku šablony.

`send` navíc vyžaduje `confirm === true`. Bez toho nic neposílej. `test` vyžaduje `testEmail`: po oříznutí malá písmena, jedno `@`, bez mezer, délka nejvýš 254.

Když uložené HTML neobsahuje `{{unsubscribe_url}}`, `count` může počet vrátit, ale `test` a `send` nic nepošlou a vrátí 400 s `{ "error": "missing_unsubscribe" }`.

Příjemce skládej jen ty. Pole adres z prohlížeče ignoruj, i kdyby přišlo.

Výběr z `newsletter_subscribers`:

- `status` je `subscribed`
- `preferences` obsahuje danou skupinu (filtr `contains` s polem o jedné skupině)
- čti po stránkách přes `range`, po 1000 řádcích, dokud stránka nepřijde kratší než 1000. Jeden select bez `range` nestačí, výchozí strop by zbytek skupiny tiše vynechal
- stejný e-mail nech v seznamu jednou

`count` Resend nevolá. Vrať `{ "ok": true, "count": N }`.

`test` najde ve výběru právě ten jeden e-mail. Když tam není, nic neposílej a vrať 404 s `{ "error": "not_in_group" }`. Když tam je, pošli jen jemu, s jeho `unsubscribe_token` a jeho `lang`.

`send` při `count === 0` nic neposílej a vrať 400 s `{ "error": "empty" }`. Jinak pošli celému výběru, který sis právě načetl. Číslo z prohlížeče nepoužívej.

`history` vrať posledních 20 řádků z `newsletter_sends` se sloupci `created_at`, `mode`, `group_key`, `subject`, `template_name`, `recipient_count`, `sent_count`, `failed_count`. Nic jiného.

## Mail

Předmět je `subject` uložené šablony. Do předmětu nepřidávej skupinu ani slovo test, pokud to v šabloně není.

HTML je uložené HTML té šablony po stejném čištění jako při uložení. Každému příjemci v něm nahraď každou značku `{{unsubscribe_url}}` adresou `{SITE_URL}/newsletter/unsubscribe?token={unsubscribe_token}`. Když je `lang` řádku `en` a viditelný text odkazu je přesně „Odhlásit odběr“, vyměň ho za „Unsubscribe“. Jiný text odkazu, který admin napsal, neměň. Po náhradě musí HTML obsahovat cestu `/newsletter/unsubscribe?token=` a token toho řádku. Když ne, toho příjemce neposílej a započítej ho do `failed`.

Každý mail má v `to` právě jednoho příjemce. Adresy nedávej do společného `bcc` ani do společného `to`. `from` ber z `RESEND_FROM_EMAIL`, jinak z věty v části **Co už v projektech je**.

Posílej na `POST https://api.resend.com/emails/batch` po nejvýš 100 mailech. Hlavička `Authorization: Bearer` a hodnota `RESEND_API_KEY`. Když jedna dávka spadne, započítej ji do chyb a pokračuj další dávkou. Na konci vrať `{ "ok": true, "sent": N, "failed": M }`. Seznam adres nevracej.

Po zkoušce i po ostrém odeslání zapiš jeden řádek do `newsletter_sends`. `sent_by` je id admina. `mode` je `test` nebo `send`. `template_id` a `template_name` vem z šablony. U zkoušky je `recipient_count` 1. Když se nepodaří zápis logu, mail už může být odeslaný: člověku vrať stejně výsledek odeslání a chybu logu jen do logu funkce.

Když chybí `RESEND_API_KEY`, `SUPABASE_URL` nebo `SUPABASE_SERVICE_ROLE_KEY`, vrať 500 s `{ "error": "Could not send" }` a do logu funkce napiš jen název proměnné, která chybí. Hodnotu klíče neloguj. `SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY` dodává Supabase do Edge Functions sám, do kódu je nepíš.

## Bezpečnost, kterou nesmíš obejít

- Stránku a funkci smí použít jen přihlášený profil s `profiles.layer === 'admin'`.
- `verify_jwt` u `send-newsletter` zůstane `true`.
- Prohlížeč tabulky `newsletter_subscribers` a `newsletter_templates` nečte přes Supabase klienta. Anon klíč na ně nedostane policy.
- `count`, `test` a `send` berou obsah z uložené šablony. HTML z těla těchto akcí ignoruj.
- Odpověď odeslání neobsahuje e-mail, token ani seznam příjemců. Výjimka je jen u zkoušky chybový kód `not_in_group`, bez opsání cizích adres.
- `RESEND_API_KEY` a service role zůstávají v secrets Edge Function. Nesmí být v gitu, v `REACT_APP_` proměnné, v `.env` frontendu ani v Reactu.
- `send` bez `confirm: true` neodešle skupinu. `count` a `test` skupinu neodešlou.
- Funkce nesmí umět odhlásit, změnit skupiny, vrátit token ani poslat na adresy, které si klient pošle v těle.
- V odeslaném mailu je odkaz na veřejný web `/newsletter/unsubscribe?token=…`. Adresa `/api/` ani URL portálu v mailu není. Bez značky `{{unsubscribe_url}}` se mail neodešle.
- Náhled v iframe nemá povolené skripty. Do uloženého HTML se nedostane `script` ani `on*` atribut.
- `.env` necommituj.

## Zastávky

Až dojdeš k zastávce, přestaň a napiš člověku text z ní. Pokračuj v kódu, teprve až napíše, že je hotovo. Kód, který na klíče ještě nečeká (stránka, editor a funkce), můžeš napsat před zastávkou 1. Nepiš mu, ať něco kóduje. Funkci nenasazuj, dokud není hotová zastávka 2.

### Zastávka 1 — tabulky

Nový Supabase projekt nezakládej. Portál už jeden má.

Napiš mu:

> V portálu otevři Supabase toho projektu, ke kterému už portál je. Nový projekt nezakládej.
>
> 1. Vlevo **Table Editor**. Najdi tabulku `newsletter_subscribers`. Má existovat (vznikla z newsletteru na veřejném webu). Když tam není, nic nezakládej a napiš Nikovi. Mně napiš jen: tabulka chybí.
> 2. Když tam je, vlevo **SQL Editor** → **New query**. Vlož celý SQL, který ti pošlu pod tímhle postupem, a dej **Run**. Má skončit bez červené chyby. Tabulku `newsletter_subscribers` tím neměníš.
> 3. Napiš mi jen: hotovo.

Pod ten postup vlož SQL z části **Tabulky**.

### Zastávka 2 — klíče funkce

Napiš mu:

> Odesílání běží ve funkci na Supabase, ne v prohlížeči. Klíče proto nepatří do `.env` portálu.
>
> 1. Ve stejném projektu otevři **Edge Functions** → **Secrets** (nebo **Project Settings** → **Edge Functions**).
> 2. Přidej secret `RESEND_API_KEY`. Hodnota je stejný klíč, kterým už veřejný web posílá přihlášky. Nový klíč v Resendu nezakládej. Do chatu ho nepiš.
> 3. Přidej secret `RESEND_FROM_EMAIL` s hodnotou `CTRL Europe <noreply@ctrleurope.com>`, pokud tam už není.
> 4. Přidej secret `SITE_URL` s hodnotou `https://ctrleurope.com`.
> 5. `SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY` do secrets nepřidávej, ty funkce dostane sama. Anon klíč nikam nekopíruj.
>
> Napiš mi jen: hotovo.

### Zastávka 3 — nasazení, šablona a počet

Až je kód napsaný a zastávky 1 a 2 jsou hotové, nasaď jen funkci:

```bash
supabase functions deploy send-newsletter
```

Příkaz spusť v kořeni portálu. Když CLI není přihlášené, zastav se a napiš člověku, ať v tom samém adresáři spustí `supabase login` a pak ti napíše hotovo. Projekt znovu nelinkuj a nový nezakládej.

Pak spusť `npm start`, pokud už neběží. Napiš mu:

> Otevři portál na adrese, kterou ti terminál vypíše (typicky http://localhost:3000), přihlas se účtem, který má roli Admin.
>
> 1. V menu máš vidět Newsletter. Otevři ho, záložka Šablony.
> 2. Dej Nová šablona. Ve Vzhledu změň nadpis. Přepni na HTML: ve zdroji má být vidět ta změna a taky `{{unsubscribe_url}}`. V HTML změň barvu pozadí hlavičky a přepni zpátky na Vzhled: hlavička má mít novou barvu. Ulož.
> 3. Záložka Odeslat. Vyber tu šablonu a Aktuality a dej Spočítat příjemce. Máš vidět počet, ne seznam adres. V náhledu není skutečný odkaz s tokenem.
> 4. Účtem, který Admin není (stačí Developer, pokud ho máš), stejnou adresu `/newsletter` otevři znovu. Má tě to vrátit na dashboard a Newsletter v menu nemá být.
>
> Napiš mi, jestli to tak je. Když ne, napiš co vidíš na stránce, kód neřeš.

### Zastávka 4 — jedna zkouška

Nech ho poslat jen zkoušku. Tlačítko „Odeslat skupině“ v tomhle kroku používat nemá.

> Na záložce Odeslat nech vybranou uloženou šablonu a Aktuality.
>
> 1. Do zkušební adresy napiš e-mail, který v té skupině je přihlášený, a dej Poslat zkoušku. Mail má přijít jen tam a má mít vzhled šablony.
> 2. V mailu najeď na odkaz pro odhlášení. Má vést na `https://ctrleurope.com/newsletter/unsubscribe?token=…`. Nemá v sobě `/api/` ani adresu portálu. Odkaz neotvírej, ať se odběr omylem nezruší.
> 3. Dej do zkoušky adresu, která v Aktualitách přihlášená není. Nemá odejít mail a stránka má napsat, že adresa v této skupině není přihlášená.
>
> Celou skupinu neposílej. „Odeslat skupině“ je až na ostré rozeslání, až bude šablona hotová a ty ji sám potvrdíš zaškrtnutím.
>
> Napiš mi, jestli zkouška přišla, jestli sedí vzhled a kam odkaz míří. Adresy příjemců mi neposílej.

## Hotovo, když

- `/newsletter` otevře jen profil s `layer` admin. Developer ho v menu nevidí a route ho vrátí na dashboard.
- Admin vytvoří šablonu, upraví ji ve Vzhledu i v HTML, uloží, znovu otevře a obě podoby sedí. Smazání se zeptá a šablonu odebere.
- Odeslání používá uloženou šablonu. Bez `{{unsubscribe_url}}` se mail neodešle.
- Spočítat příjemce ukáže jen číslo přihlášených v jedné skupině. Adresy na stránce nejsou.
- Zkouška odejde jen na adresu, která v té skupině má `status` subscribed, a má vzhled šablony. Cizí adresa nic neodešle.
- Odeslat skupině je vypnuté, dokud není čerstvý počet a zaškrtnuté potvrzení. Funkce bez `confirm: true` skupinu neodešle.
- Každý mail má vlastního příjemce a vlastní odkaz na `https://ctrleurope.com/newsletter/unsubscribe?token=…`. V mailu není `/api/` ani portál.
- V gitu, v Reactu ani v `REACT_APP_` není service role, Resend klíč ani seznam odběratelů.
- `newsletter_subscribers` z portálu nikdo v prohlížeči nečte. Funkce ty řádky jen čte.
- `send-push` a veřejný web zůstaly beze změny.
