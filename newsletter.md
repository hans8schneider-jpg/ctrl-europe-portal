# Newsletter — odesílání z portálu

Pracuješ v repozitáři `/home/nikola/Desktop/code/ctrl-europe-portal`. Jiný projekt neotvírej a neměň.

Člověk, který tohle zadání zadává, má jen základní zkušenost s vibecodingem. Kód píšeš ty. Jeho zastav jen tam, kde musí kliknout v cizím účtu nebo něco vyzkoušet očima. V těch místech mu napiš přesný postup z části **Zastávky**. Nepožaduj po něm, aby vymýšlel architekturu, psal SQL, sahal do kódu nebo rozhodoval, jak to zabezpečit.

Neměň pravidla v tomhle souboru. Když narazíš na chybu, oprav ji sám. Člověku řekni jednou větou, co se stalo a co má udělat on, ne aby to ladil v kódu.

Když napíše, že neví, co se děje, nebo že zadání nechápe, nevracej mu otázku, co máš postavit. Napiš mu jednou větou cíl z části **Co stavíš** a hned další konkrétní krok, který uděláš ty. Architekturu po něm nechtěj. Všechna rozhodnutí jsou v tomhle souboru.

## Co stavíš

Lidé se na veřejném webu přihlásili k newsletteru a vybrali si témata: Aktuality, Workshopy, Summit, CTRL Run. Tohle už běží. Ty to nestavíš znovu.

Ty stavíš druhou část: stránku uvnitř interního portálu, odkud zaměstnanec s rolí Admin připraví vzhled mailu a pošle ho jedné z těch skupin. Ostatní zaměstnanci portál vidí, tuhle stránku ne. Veřejnost portál nevidí vůbec.

Admin na stránce dělá dvě věci:

1. **Šablony.** Složí, jak mail vypadá. Upravuje ho očima (bloky, barvy, text) a taky jako HTML kód. Obě úpravy jsou tentýž mail. Uloží ho pod názvem. V seznamu už jedna šablona je: vypadá jako mail, který web pošle člověku hned po přihlášení k newsletteru.
2. **Odeslat.** Vybere uloženou šablonu a jednu skupinu. Nejdřív uvidí jen počet lidí. Může poslat zkoušku na jednu přihlášenou adresu. Celé skupině mail odejde až po zaškrtnutí potvrzení.

Každý člověk dostane vlastní mail se svým odkazem na odhlášení na veřejném webu `https://ctrleurope.com`. Seznam adres se v portálu nikdy neukáže.

## Co nestavíš

- Formulář, kterým se lidé na webu přihlašují.
- Stránku odhlášení. Ta už je na veřejném webu.
- Mail, který web pošle sám, hned když se někdo přihlásí. Ten kód neměň. V portálu z něj jen uděláš šablonu, aby další maily vypadaly stejně.
- E-maily členům portálu a e-maily do buněk (PR, Research, Předsednictvo a další). Buňka není skupina newsletteru.
- Nový účet u Resendu, nový projekt v Supabase, nový způsob přihlášení do portálu.

Když v kódu portálu najdeš přihlašování, úkoly, chat nebo admin panel, nech je být. Přidáváš jen stránku Newsletter a funkci, která šablony ukládá a maily posílá.

## Slovníček

| slovo | co to je |
|---|---|
| Portál | Web pro zaměstnance. Tenhle repozitář. Bez přihlášení na něj nikdo nevidí. |
| Veřejný web | `https://ctrleurope.com`. Tam se lidé k newsletteru přihlašují a odhlašují. Do toho repozitáře nešahej. |
| Admin | Zaměstnanec, který smí newsletter poslat. V datech má `profiles.layer` rovno `admin`. Developer to není, i když vidí stránku Admin. |
| Skupina | Téma, které si člověk zaškrtl na webu: `news`, `workshops`, `summit`, `run`. Na obrazovce Aktuality, Workshopy, Summit, CTRL Run. |
| Odběratel | Řádek v tabulce `newsletter_subscribers`. E-mail, skupiny, jazyk, stav přihlášen nebo odhlášen, tajný kód pro odhlášení. |
| Šablona | Uložený vzhled jednoho mailu: název, předmět a HTML. Admin jich může mít víc a posílá vždycky jednu uloženou. |
| `{{unsubscribe_url}}` | Zástupný text v šabloně. Při odeslání ho server vymění za skutečný odkaz toho člověka. V šabloně nikdy není jeho tajný kód. |
| Edge Function | Kód, který běží na Supabase, ne v prohlížeči. Jmenuje se `send-newsletter`. Prohlížeč ho jen požádá. Seznam adres a tajné klíče zůstávají tam. |
| Resend | Služba, která mail opravdu doručí. Účet už organizace má. Nový nezakládej. |
| Zastávka | Místo, kde přestaneš a počkáš, až člověk klikne v Supabase nebo mail vyzkouší. Mezitím nepokračuj. |

## Jak to admin použije

1. Přihlásí se do portálu účtem Admin a v menu otevře Newsletter.
2. Na záložce Šablony dá Nová šablona. Ve Vzhledu změní text a barvy. Přepne na HTML, uvidí totéž jako kód, může ho upravit a přepnout zpátky. Uloží.
3. Na záložce Odeslat vybere tu šablonu a třeba Aktuality. Dá Spočítat příjemce. Vidí číslo, ne adresy.
4. Do zkoušky napíše svůj e-mail, pokud ho v Aktualitách má přihlášený. Přijde jeden mail v tom vzhledu. Odkaz dole vede na veřejný web a odhlásí jen jeho.
5. Až bude chtít poslat všem v Aktualitách, zaškrtne potvrzení a dá Odeslat skupině. Každý dostane vlastní odkaz.

Na tu stránku se nedostane zaměstnanec, který Admin není. Veřejnost se tam nedostane vůbec.

## Co už v projektech je

Tahle část říká, na čem portál stojí, ať nepřidáváš druhý framework ani druhou databázi.

Portál je Create React App (`react-scripts`), React 18, React Router 6, Tailwind. Celá aplikace je až za přihlášením (`src/App.js`, `supabase.auth.signInWithPassword`). Prohlížeč mluví se Supabase jen přes `src/supabase.js` a proměnné `REACT_APP_SUPABASE_URL` a `REACT_APP_SUPABASE_ANON_KEY`. Složka `api/` tu není. Cokoli, co potřebuje tajný klíč, je Supabase Edge Function. Vzor je `supabase/functions/send-push/index.ts`, ale ten vzor nekopíruj slepě: `send-push` má v `supabase/config.toml` `verify_jwt = false`, protože ho volá webhook. Newsletter tak nesmí být.

Admin v tomhle zadání znamená jen `profiles.layer === 'admin'`. V kódu je to `admin` z `useAppData()` (`isAdmin` v `src/lib/permissions.js`). `adminPanelAccess` je širší: vidí ho i developer a člověk s `can_see_all_buckets`. Ti newsletter posílat nesmí a odkaz na něj nevidí.

Buňky (PR a komunikace, Research, Předsednictvo a další) jsou interní týmy. Nejsou to skupiny newsletteru a e-mail jim neposílej.

Odběratelé jsou v tabulce `newsletter_subscribers` ve stejném Supabase projektu, ke kterému je portál už připojený. Veřejný web do ní zapisuje svým serverem. Sloupce, které smíš číst: `email`, `preferences`, `lang`, `status`, `unsubscribe_token`. Povolené skupiny v `preferences`: `news`, `workshops`, `summit`, `run`. `status` je `subscribed` nebo `unsubscribed`. `lang` je `cs` nebo `en`. Řádek z téhle funkce neupravuj. Token neměň. Nový Supabase projekt nezakládej.

Odhlášení už umí veřejný web. V šabloně je značka `{{unsubscribe_url}}`. Při odeslání ji funkce nahradí adresou `{SITE_URL}/newsletter/unsubscribe?token={unsubscribe_token}` toho příjemce. Výchozí `SITE_URL` je `https://ctrleurope.com`. V odkazu nikdy není `/api/` a nikdy adresa portálu.

Resend už posílá maily z veřejného webu. Nový Resend účet nezakládej. Odesílatel je proměnná `RESEND_FROM_EMAIL`, a když chybí, `CTRL Europe <noreply@ctrleurope.com>`.

## Co má vzniknout

Stránka pro admina a jedna funkce na serveru. Prohlížeč ukládá šablony a žádá o odeslání. Seznam odběratelů skládá jen funkce.

Admin otevře `/newsletter`. Na záložce Šablony vytvoří šablonu, upraví ji ve vizuálním editoru a ve zdrojovém HTML a uloží. Na záložce Odeslat skládá mail ve stejném editoru, zase ve vzhledu a v HTML. Šablona je volitelná: když ji vybere, jen předvyplní editor. Poslat jde i bez ní. Nejdřív vidí jen počet příjemců. Může poslat zkoušku na jednu adresu, která v té skupině je. Celou skupinu odešle až po zaškrtnutí potvrzení. Šablony, počet, zkoušku i odeslání dělá Edge Function `send-newsletter`. Prohlížeč tabulku odběratelů nečte a jejich adresy nikdy nedostane. Mail, který odchází, je HTML z editoru na záložce Odeslat po stejném čištění jako při uložení šablony.

Vzhled stránky drž u admin stránky: tmavý panel, `Sec`, mono popisky, stávající inputy a tlačítka (`bg-ctrl-panel`, `bg-ctrl-bg2`, `border-ctrl-border`, `text-ctrl-accent`). Texty jen česky. Portál nemá přepínač jazyka. Framer Motion nepřidávej. Vlastní CSS soubor pro stránku nezakládej. CSS editoru z knihovny GrapesJS naimportuj, jinak se editor nerozloží.

## Soubory

Jen tyhle soubory. Když máš pocit, že potřebuješ další, řešení je v některém z nich, ne v novém balíku.

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

Dvě nové tabulky. `newsletter_templates` jsou uložené vzhledy mailů. `newsletter_sends` je jen záznam, že se posílalo: kdo, která šablona, která skupina, kolik mailů. Adresy lidí se sem nepíšou.

`newsletter_subscribers` je tabulka odběratelů z veřejného webu. Už existuje. Nevytvářej ji znovu a nepřidávej k ní policy.

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

To, co admin vidí na `/newsletter`. Nejdřív zámek, ať tam nikdo jiný nevleze, potom dvě záložky.

Route v `src/App.js` pod `AppLayout`, vedle `admin`. Obal ji stejně jako `AdminRoute`, ale pusť dál jen když `admin` z `useAppData()` je true. Jinak `Navigate` na `/`. Developer, který vidí Admin, na `/newsletter` skončí na dashboardu.

V `NAV_MAIN` přidej položku Newsletter. Podmínku nevěš na `adminPanelAccess`. Odkaz vykresli jen když je `admin`. Ve spodní mobilní liště ho nepřidávej, lišta je plná. Do vysouvacího menu, do bloku Portál nad Report, přidej řádek Newsletter se stejným cílem, zase jen pro `admin`. Po kliknutí menu zavři. Do `PAGE_TITLES` dej `/newsletter`: `Newsletter`.

Dvě záložky ve stejném stylu jako záložky na admin stránce: **Šablony** a **Odeslat**.

### Šablony

Tady admin skládá vzhled a ukládá ho. Text v šabloně je ukázka, jak mail bude vypadat. Ještě se nikomu nic neposílá.

Seznam uložených šablon: název, předmět, datum poslední úpravy. Když admin seznam otevře poprvé, je v něm šablona **Přihlášení k newsletteru**. Je to vzhled mailu po přihlášení na webu, ne nový mail, který bys vymýšlel. Tlačítko „Nová šablona“ otevře editor se stejným HTML, ať další mail začíná ve stejném kabátě. Klik na řádek otevře tu šablonu v editoru. Tlačítka editoru: „Uložit“ a u existující šablony „Smazat“. Smazání se zeptá větou „Smazat šablonu {název}?“ a až potom smaže. Rozepsanou neuloženou šablonu při odchodu ze záložky nezahazuj potichu: když jsou neuložené změny, napiš „Máš neuložené změny.“ a nech ho uložit, nebo změny zahodit.

Editor je `src/components/NewsletterTemplateEditor.js`. Nad ním pole Název a Předmět. Pod nimi přepínač **Vzhled** a **HTML**. Oba režimy upravují jeden řetězec. Co se změní v jednom, po přepnutí uvidí ve druhém.

**Vzhled.** Obyčejné kreslení mailu: text, obrázek, tlačítko, barvy. Na to použij knihovnu GrapesJS s presetem `grapesjs-preset-newsletter`. Je to editor e-mailů, ne obecný editor článků. Editor inicializuj v `useEffect` a při odmontování ho znič. Lištu GrapesJS nech v češtině tam, kde preset má vlastní text; zbytek nepřekládej, když na to preset nemá háček. Bloky, které admin ve vzhledu použije, jsou bloky toho presetu (text, obrázek, tlačítko, oddělovač, sloupce). Navíc do lišty dej vlastní tlačítko „Odhlášení“, které do plátna vloží odkaz:

```html
<a href="{{unsubscribe_url}}">Odhlásit odběr</a>
```

Náhled v editoru nesmí značku nahradit živým tokenem. `href` v uloženém HTML zůstane `{{unsubscribe_url}}`.

**HTML.** Tentýž mail jako kód, kdyby admin chtěl barvu nebo tabulku napsat ručně. Textarea s celým zdrojovým HTML, `font-mono`, bílé místo zachovat. Po přepnutí z Vzhledu do HTML do ní vlož HTML s inline styly příkazem presetu `gjs-get-inlined-html`. Po přepnutí z HTML zpátky na Vzhled ten text naimportuj do editoru. Když import selže, nech člověka v režimu HTML, šablonu nepřepisuj prázdným dokumentem a na stránce ukaž „Tohle HTML se nepodařilo otevřít ve vzhledu. Uprav zdroj, nebo ho vrať.“

Uložení pošle název, předmět a HTML z právě otevřeného režimu (u Vzhledu z `gjs-get-inlined-html`). Prázdný název, prázdný předmět nebo prázdné HTML neukládej.

### Odeslat

Tady admin skládá mail, který odejde. Editor je stejný jako u šablony: předmět, přepínač **Vzhled** a **HTML**. Název, Uložit a Smazat tu nejsou. Rozepsaný mail se do šablony neukládá. Bez vybrané šablony editor začíná vzhledem mailu po přihlášení.

1. Výběr šablony je volitelný. První položka je „Bez šablony“. Když vybere uloženou šablonu, editor se předvyplní jejím předmětem a HTML. Když už v mailu něco změnil, nejdřív se zeptej „Nahradit rozepsaný mail touto šablonou?“. Bez šablony jde spočítat příjemce, poslat zkoušku i odeslat skupinu.
2. Předmět a plátno mailu. Ve vzhledu GrapesJS, v HTML zdroj. Značka `{{unsubscribe_url}}` zůstane, token do editoru nedávej.
3. Výběr jedné skupiny. Viditelné názvy: Aktuality, Workshopy, Summit, CTRL Run. Hodnoty posílané funkci: `news`, `workshops`, `summit`, `run`.
4. Tlačítko „Spočítat příjemce“.
5. Po úspěšném počtu věta „V této skupině je N přihlášených.“ a zaškrtávátko „Odesílám tento mail celé skupině.“ Tlačítko „Odeslat skupině“ je do té doby vypnuté.
6. Zkušební adresa a tlačítko „Poslat zkoušku“. Zkouška nepotřebuje zaškrtnuté potvrzení hromadného odeslání.
7. Pod tím seznam posledních odeslání: datum, název šablony, skupina, předmět, režim Zkouška nebo Skupina, počty. E-maily příjemců tam nejsou.

Když člověk změní skupinu, počet zahoď, zaškrtávátko vypni a „Odeslat skupině“ znovu zablokuj. Tlačítka během requestu zablokuj, ať neodejde druhý klik. Prázdný předmět, prázdný obsah nebo chybějící `{{unsubscribe_url}}` zkoušku ani odeslání nepustí.

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

Zkouška je `action: "test"`, `group`, `testEmail`, `subject` a `html`. Skupina je `action: "send"`, `group`, `"confirm": true`, `subject` a `html`. `templateId` je volitelné. Historie je `{ "action": "history" }`. `count` potřebuje jen `group`.

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

## Šablona podle mailu po přihlášení

Na veřejném webu, hned po uložení přihlášení, odchází potvrzovací mail. Má logo CTRL Europe, tmavou hlavičku s malým nadpisem Newsletter a větou „Jste přihlášeni.“, šedý úvod, světle modrý box se skupinami, dvě tlačítka (tmavé „Navštívit web“ a obrysové „Odhlásit odběr“) a pod tím větu o digitální odolnosti. Ten vzhled vezmi jako hotovou šablonu. Nový nevymýšlej a veřejný web kvůli tomu neupravuj.

Šablona se jmenuje `Přihlášení k newsletteru`. Předmět je `Jste přihlášeni — CTRL Europe`. Text v ní je ukázka, admin ho smí přepsat. Vzhled (logo, hlavička, modrý box, obě tlačítka, patička) v té uložené šabloně nech, dokud ho admin sám nezmění.

Jediný rozdíl proti mailu z webu: odkaz na odhlášení není živý token, ale značka `{{unsubscribe_url}}`. Logo a odkaz na web vedou na `https://ctrleurope.com`. Obrázek loga je `https://ctrleurope.com/ctrl_logo_bez_pozadi.png`.

Když je tabulka `newsletter_templates` prázdná a admin poprvé načte seznam, funkce tam tenhle jeden řádek vloží. `created_by` je id toho admina. Když už v tabulce nějaká šablona je, nic znovu nevkládej a existující řádky nepřepisuj. Stejné HTML dostane i „Nová šablona“, jen ještě není uložené.

Když GrapesJS tenhle dokument ve Vzhledu otevře a chybí logo, tmavá hlavička, modrý box nebo tlačítko odhlášení, uložené HTML nepřepisuj prázdným plátnem. Nech šablonu v režimu HTML.

```html
<!DOCTYPE html>
<html lang="cs">
  <head>
    <meta charset="UTF-8" />
    <title>Jste přihlášeni.</title>
    <style type="text/css">
      html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
      body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { border-collapse: collapse; }
      img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
      a { text-decoration: none; }
      @media only screen and (max-width: 620px) {
        .email-outer { padding: 20px 12px 28px !important; }
        .email-hero { padding: 22px 18px 20px !important; border-radius: 10px 10px 0 0 !important; }
        .email-body { padding: 22px 18px !important; border-radius: 0 0 10px 10px !important; }
        .email-headline { font-size: 24px !important; line-height: 1.2 !important; }
        .email-summary { padding: 16px !important; }
        .email-row-label, .email-row-value { display: block !important; width: 100% !important; }
        .email-cta-cell { display: block !important; width: 100% !important; padding: 0 0 10px !important; }
        .email-cta-link { display: block !important; text-align: center !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f3;font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0b1020;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f3;width:100%;">
      <tr>
        <td class="email-outer" align="center" style="padding:40px 20px 48px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
            <tr>
              <td style="padding:0 0 28px;text-align:center;">
                <a href="https://ctrleurope.com" style="text-decoration:none;">
                  <img src="https://ctrleurope.com/ctrl_logo_bez_pozadi.png" alt="CTRL Europe" width="148" style="display:inline-block;width:148px;max-width:100%;height:auto;border:0;" />
                </a>
              </td>
            </tr>
            <tr>
              <td class="email-hero" style="background:#0b1020;border-radius:12px 12px 0 0;padding:28px 32px 24px;">
                <p style="margin:0 0 10px;font-family:Geist Mono,Consolas,monospace;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#4a7bff;">
                  <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#4a7bff;vertical-align:middle;margin-right:8px;"></span>
                  Newsletter
                </p>
                <h1 class="email-headline" style="margin:0;font-size:28px;line-height:1.1;font-weight:800;letter-spacing:-0.8px;color:#f5f5f3;">Jste přihlášeni.</h1>
              </td>
            </tr>
            <tr>
              <td class="email-body" style="background:#ffffff;border:1px solid rgba(11,16,32,0.08);border-top:none;border-radius:0 0 12px 12px;padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;font-weight:600;color:#0b1020;">Ahoj,</p>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#6b7280;">Děkujeme za přihlášení k newsletteru CTRL Europe. Napíšeme, až bude něco nového ve skupinách, které jste zvolili.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;width:100%;">
                  <tr>
                    <td class="email-summary" style="background:#eff4ff;border:1px solid rgba(29,78,216,0.14);border-left:3px solid #1d4ed8;border-radius:8px;padding:20px 22px;">
                      <h2 style="margin:0 0 14px;font-size:13px;line-height:1.4;font-weight:700;color:#0b1020;">Váš odběr</h2>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
                        <tr>
                          <td class="email-row-label" style="padding:10px 0;border-bottom:1px solid rgba(29,78,216,0.12);font-family:Geist Mono,Consolas,monospace;font-size:10px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;color:#1d4ed8;vertical-align:top;width:42%;">Skupiny</td>
                          <td class="email-row-value" style="padding:10px 0 10px 16px;border-bottom:1px solid rgba(29,78,216,0.12);font-size:14px;line-height:1.5;color:#0b1020;font-weight:500;">Aktuality</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#0b1020;">Skupiny můžete změnit opětovným odesláním formuláře, nebo se odhlásit tlačítkem níže.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="width:auto;">
                  <tr>
                    <td class="email-cta-cell" style="border-radius:8px;background:#0b1020;">
                      <a class="email-cta-link" href="https://ctrleurope.com" style="display:inline-block;padding:14px 24px;font-size:14px;font-weight:600;color:#f5f5f3;text-decoration:none;">Navštívit web &rarr;</a>
                    </td>
                    <td class="email-cta-cell" style="padding-left:10px;">
                      <a class="email-cta-link" href="{{unsubscribe_url}}" style="display:inline-block;padding:14px 24px;font-size:14px;font-weight:600;color:#0b1020;text-decoration:none;border:1px solid rgba(11,16,32,0.18);border-radius:8px;">Odhlásit odběr &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 12px 0;text-align:center;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#6b7280;">Budujeme digitální odolnost pro novou evropskou generaci.</p>
                <p style="margin:0;font-family:Geist Mono,Consolas,monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">CTRL Europe · <a href="https://ctrleurope.com" style="color:#4a7bff;text-decoration:none;">ctrleurope.com</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

Při uložení čištění nesmí smazat značku `style`, obrázek loga ani `{{unsubscribe_url}}`. Značku `meta` smaž jako u ostatních šablon, na vzhled to nemá vliv.

## Edge Function

To je serverová část. Prohlížeč jí řekne „ulož šablonu“, „kolik lidí je v Aktualitách“ nebo „pošli“. Ona zkontroluje, že volá Admin, šablonu uloží nebo načte a jako jediná smí číst odběratele a zavolat Resend. Tajný klíč v prohlížeči není.

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

### Šablony ve funkci

Uložení, úprava, smazání a seznam. Pořád jen pro Admina. Prohlížeč do tabulky sám nesahá.

`templates` nejdřív zjistí, jestli `newsletter_templates` má nějaký řádek. Když je prázdná, vlož šablonu z části **Šablona podle mailu po přihlášení** (název, předmět i HTML) a `created_by` nastav na id přihlášeného admina. Pak vrať všechny řádky se sloupci `id`, `name`, `subject`, `html`, `updated_at`, seřazené podle `updated_at` sestupně.

`template_create` a `template_update` vyžadují název po oříznutí 1 až 80 znaků, předmět po oříznutí 1 až 120 znaků a HTML délky 1 až 100000 znaků. `template_update` a `template_delete` vyžadují `id` ve tvaru UUID. Neznámé id vrať 404 s `{ "error": "not_found" }`.

Před zápisem HTML vyčisti, v prohlížeči se na to nespoléhej:

- smaž značky `script`, `iframe`, `object`, `embed`, `form`, `link`, `meta`
- smaž atributy začínající `on`
- smaž `href` a `src`, které nezačínají na `https://`, `http://`, `mailto:` nebo nejsou přesně `{{unsubscribe_url}}` (u `href`)
- `{{unsubscribe_url}}` v textu nech. Skutečný unsubscribe token do šablony nepiš, i kdyby ho tělo obsahovalo. Když v HTML najdeš `/newsletter/unsubscribe?token=`, ten query parametr `token` vyhoď

Po vytvoření vrať `{ "ok": true, "template": { "id", "name", "subject", "html", "updated_at" } }`. Po úpravě totéž. Po smazání `{ "ok": true }`.

### Odeslání ve funkci

Tři kroky, které admin vidí jako tři tlačítka. `count` jen spočítá. `test` pošle jednomu člověku, který v té skupině je. `send` pošle celé skupině, a jen když prohlížeč poslal `confirm: true`. `count` potřebuje jen `group`. `test` a `send` berou `subject` a `html` z těla. HTML vyčisti stejně jako při uložení šablony. `templateId` je volitelné: když přijde, do logu zapiš název té šablony. Když nepřijde, `template_id` je prázdné a `template_name` je `Bez šablony`. HTML z uložené šablony při odeslání nenačítej, editor ho už poslal.

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

Jak vypadá zpráva, která opravdu odejde. Předmět a HTML jsou z těla tohohle odeslání. Jediná věc, která se liší člověk od člověka, je odkaz na odhlášení.

Předmět je `subject` z těla, 1 až 120 znaků. Do předmětu nepřidávej skupinu ani slovo test, pokud to v textu není. Do `newsletter_sends` zapiš předmět, který opravdu odešel.

HTML je `html` z těla po stejném čištění jako při uložení šablony. Každému příjemci v něm nahraď každou značku `{{unsubscribe_url}}` adresou `{SITE_URL}/newsletter/unsubscribe?token={unsubscribe_token}`. Když je `lang` řádku `en` a viditelný text odkazu je přesně „Odhlásit odběr“, vyměň ho za „Unsubscribe“. Jiný text odkazu, který admin napsal, neměň. Po náhradě musí HTML obsahovat cestu `/newsletter/unsubscribe?token=` a token toho řádku. Když ne, toho příjemce neposílej a započítej ho do `failed`.

Každý mail má v `to` právě jednoho příjemce. Adresy nedávej do společného `bcc` ani do společného `to`. `from` ber z `RESEND_FROM_EMAIL`, jinak z věty v části **Co už v projektech je**.

Posílej na `POST https://api.resend.com/emails/batch` po nejvýš 100 mailech. Hlavička `Authorization: Bearer` a hodnota `RESEND_API_KEY`. Když jedna dávka spadne, započítej ji do chyb a pokračuj další dávkou. Na konci vrať `{ "ok": true, "sent": N, "failed": M }`. Seznam adres nevracej.

Po zkoušce i po ostrém odeslání zapiš jeden řádek do `newsletter_sends`. `sent_by` je id admina. `mode` je `test` nebo `send`. `template_id` a `template_name` vem z šablony. U zkoušky je `recipient_count` 1. Když se nepodaří zápis logu, mail už může být odeslaný: člověku vrať stejně výsledek odeslání a chybu logu jen do logu funkce.

Když chybí `RESEND_API_KEY`, `SUPABASE_URL` nebo `SUPABASE_SERVICE_ROLE_KEY`, vrať 500 s `{ "error": "Could not send" }` a do logu funkce napiš jen název proměnné, která chybí. Hodnotu klíče neloguj. `SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY` dodává Supabase do Edge Functions sám, do kódu je nepíš.

## Bezpečnost, kterou nesmíš obejít

Seznam adres a klíč k odesílání nesmí nikdy doputovat do prohlížeče. Kdyby ano, stačilo by otevřít portál a newsletter stáhnout nebo rozeslat. Proto všechno citlivé dělá jen Edge Function a jen pro Admina.

- Stránku a funkci smí použít jen přihlášený profil s `profiles.layer === 'admin'`.
- `verify_jwt` u `send-newsletter` zůstane `true`.
- Prohlížeč tabulky `newsletter_subscribers` a `newsletter_templates` nečte přes Supabase klienta. Anon klíč na ně nedostane policy.
- `count` bere jen skupinu. `test` a `send` berou předmět a HTML z těla a HTML projde stejným čištěním jako šablona. Nečištěné HTML se neodešle.
- Odpověď odeslání neobsahuje e-mail, token ani seznam příjemců. Výjimka je jen u zkoušky chybový kód `not_in_group`, bez opsání cizích adres.
- `RESEND_API_KEY` a service role zůstávají v secrets Edge Function. Nesmí být v gitu, v `REACT_APP_` proměnné, v `.env` frontendu ani v Reactu.
- `send` bez `confirm: true` neodešle skupinu. `count` a `test` skupinu neodešlou.
- Funkce nesmí umět odhlásit, změnit skupiny, vrátit token ani poslat na adresy, které si klient pošle v těle.
- V odeslaném mailu je odkaz na veřejný web `/newsletter/unsubscribe?token=…`. Adresa `/api/` ani URL portálu v mailu není. Bez značky `{{unsubscribe_url}}` se mail neodešle.
- Náhled v iframe nemá povolené skripty. Do uloženého HTML se nedostane `script` ani `on*` atribut.
- `.env` necommituj.

## Zastávky

Zastávka znamená: dál to bez člověka nejde, protože jen on má přístup do Supabase nebo do své schránky. Přestaň a napiš mu text z té zastávky. Pokračuj, teprve až odpoví, že je hotovo. Nepiš mu, ať něco kóduje a nevysvětluj mu, jak Edge Function funguje. Stačí postup, který má odkliknout.

Kód stránky, editoru a funkce napiš klidně před zastávkou 1. Funkci nenasazuj, dokud není hotová zastávka 2.

### Zastávka 1 — tabulky

Člověk v existující databázi zkontroluje, že odběratelé z webu už tam jsou, a založí dvě nové tabulky pro šablony a pro záznam odeslání. Nový Supabase projekt nezakládej. Portál už jeden má.

Napiš mu:

> V portálu otevři Supabase toho projektu, ke kterému už portál je. Nový projekt nezakládej.
>
> 1. Vlevo **Table Editor**. Najdi tabulku `newsletter_subscribers`. Má existovat (vznikla z newsletteru na veřejném webu). Když tam není, nic nezakládej a napiš Nikovi. Mně napiš jen: tabulka chybí.
> 2. Když tam je, vlevo **SQL Editor** → **New query**. Vlož celý SQL, který ti pošlu pod tímhle postupem, a dej **Run**. Má skončit bez červené chyby. Tabulku `newsletter_subscribers` tím neměníš.
> 3. Napiš mi jen: hotovo.

Pod ten postup vlož SQL z části **Tabulky**.

### Zastávka 2 — klíče funkce

Bez klíče k Resendu funkce mail neodešle. Klíč patří do Supabase k té funkci, ne do souboru `.env` portálu, protože ten se dostane do prohlížeče.

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

Nasadíš funkci a člověk očima zkontroluje, že Admin stránku vidí, šablonu upraví ve vzhledu i v HTML a u skupiny uvidí počet. Mail se v tomhle kroku ještě neposílá.

Až je kód napsaný a zastávky 1 a 2 jsou hotové, nasaď jen funkci:

```bash
supabase functions deploy send-newsletter
```

Příkaz spusť v kořeni portálu. Když CLI není přihlášené, zastav se a napiš člověku, ať v tom samém adresáři spustí `supabase login` a pak ti napíše hotovo. Projekt znovu nelinkuj a nový nezakládej.

Pak spusť `npm start`, pokud už neběží. Napiš mu:

> Otevři portál na adrese, kterou ti terminál vypíše (typicky http://localhost:3000), přihlas se účtem, který má roli Admin.
>
> 1. V menu máš vidět Newsletter. Otevři ho, záložka Šablony.
> 2. V seznamu už má být šablona Přihlášení k newsletteru. Otevři ji. Má vypadat jako mail po přihlášení na webu: logo, tmavá hlavička „Jste přihlášeni.“, modrý box a dvě tlačítka. V HTML má být `{{unsubscribe_url}}`, ne opravdový token. Pak dej Nová šablona, ve Vzhledu změň nadpis, přepni na HTML (změna i odkaz na odhlášení tam jsou), v HTML změň barvu pozadí hlavičky a přepni zpátky na Vzhled. Ulož.
> 3. Záložka Odeslat. Vyber tu šablonu a Aktuality a dej Spočítat příjemce. Máš vidět počet, ne seznam adres. V náhledu není skutečný odkaz s tokenem.
> 4. Účtem, který Admin není (stačí Developer, pokud ho máš), stejnou adresu `/newsletter` otevři znovu. Má tě to vrátit na dashboard a Newsletter v menu nemá být.
>
> Napiš mi, jestli to tak je. Když ne, napiš co vidíš na stránce, kód neřeš.

### Zastávka 4 — jedna zkouška

Jeden mail na jednu přihlášenou adresu, ať je vidět vzhled a odkaz na odhlášení. Celou skupinu v tomhle kroku neposílej. Tlačítko „Odeslat skupině“ používat nemá.

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

Hotovo není, když kód jen přibyl. Hotovo je, když platí všechno v tomhle seznamu.

- `/newsletter` otevře jen profil s `layer` admin. Developer ho v menu nevidí a route ho vrátí na dashboard.
- V seznamu je šablona Přihlášení k newsletteru se vzhledem mailu po přihlášení na webu: logo, tmavá hlavička, modrý box, dvě tlačítka, v odkazu na odhlášení jen `{{unsubscribe_url}}`.
- Admin vytvoří další šablonu ze stejného vzhledu, upraví ji ve Vzhledu i v HTML, uloží, znovu otevře a obě podoby sedí. Smazání se zeptá a šablonu odebere.
- Odeslání používá mail složený na záložce Odeslat, ve vzhledu nebo v HTML. Šablona je volitelná a jen ho předvyplní. Bez `{{unsubscribe_url}}` se mail neodešle.
- Spočítat příjemce ukáže jen číslo přihlášených v jedné skupině. Adresy na stránce nejsou.
- Zkouška odejde jen na adresu, která v té skupině má `status` subscribed, a má vzhled šablony. Cizí adresa nic neodešle.
- Odeslat skupině je vypnuté, dokud není čerstvý počet a zaškrtnuté potvrzení. Funkce bez `confirm: true` skupinu neodešle.
- Každý mail má vlastního příjemce a vlastní odkaz na `https://ctrleurope.com/newsletter/unsubscribe?token=…`. V mailu není `/api/` ani portál.
- V gitu, v Reactu ani v `REACT_APP_` není service role, Resend klíč ani seznam odběratelů.
- `newsletter_subscribers` z portálu nikdo v prohlížeči nečte. Funkce ty řádky jen čte.
- `send-push` a veřejný web zůstaly beze změny.
