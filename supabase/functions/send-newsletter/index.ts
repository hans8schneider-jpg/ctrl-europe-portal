import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { parseHTML } from "npm:linkedom@0.18.12";

const WELCOME_NAME = "Přihlášení k newsletteru";
const WELCOME_SUBJECT = "Jste přihlášeni — CTRL Europe";
const WELCOME_HTML = "<!DOCTYPE html>\n<html lang=\"cs\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <title>Jste přihlášeni.</title>\n    <style type=\"text/css\">\n      html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }\n      body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }\n      table, td { border-collapse: collapse; }\n      img { border: 0; line-height: 100%; outline: none; text-decoration: none; }\n      a { text-decoration: none; }\n      @media only screen and (max-width: 620px) {\n        .email-outer { padding: 20px 12px 28px !important; }\n        .email-hero { padding: 22px 18px 20px !important; border-radius: 10px 10px 0 0 !important; }\n        .email-body { padding: 22px 18px !important; border-radius: 0 0 10px 10px !important; }\n        .email-headline { font-size: 24px !important; line-height: 1.2 !important; }\n        .email-summary { padding: 16px !important; }\n        .email-row-label, .email-row-value { display: block !important; width: 100% !important; }\n        .email-cta-cell { display: block !important; width: 100% !important; padding: 0 0 10px !important; }\n        .email-cta-link { display: block !important; text-align: center !important; }\n      }\n    </style>\n  </head>\n  <body style=\"margin:0;padding:0;background:#f5f5f3;font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0b1020;\">\n    <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f5f5f3;width:100%;\">\n      <tr>\n        <td class=\"email-outer\" align=\"center\" style=\"padding:40px 20px 48px;\">\n          <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:600px;width:100%;\">\n            <tr>\n              <td style=\"padding:0 0 28px;text-align:center;\">\n                <a href=\"https://ctrleurope.com\" style=\"text-decoration:none;\">\n                  <img src=\"https://ctrleurope.com/ctrl_logo_bez_pozadi.png\" alt=\"CTRL Europe\" width=\"148\" style=\"display:inline-block;width:148px;max-width:100%;height:auto;border:0;\" />\n                </a>\n              </td>\n            </tr>\n            <tr>\n              <td class=\"email-hero\" style=\"background:#0b1020;border-radius:12px 12px 0 0;padding:28px 32px 24px;\">\n                <p style=\"margin:0 0 10px;font-family:Geist Mono,Consolas,monospace;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#4a7bff;\">\n                  <span style=\"display:inline-block;width:6px;height:6px;border-radius:50%;background:#4a7bff;vertical-align:middle;margin-right:8px;\"></span>\n                  Newsletter\n                </p>\n                <h1 class=\"email-headline\" style=\"margin:0;font-size:28px;line-height:1.1;font-weight:800;letter-spacing:-0.8px;color:#f5f5f3;\">Jste přihlášeni.</h1>\n              </td>\n            </tr>\n            <tr>\n              <td class=\"email-body\" style=\"background:#ffffff;border:1px solid rgba(11,16,32,0.08);border-top:none;border-radius:0 0 12px 12px;padding:32px;\">\n                <p style=\"margin:0 0 16px;font-size:16px;line-height:1.6;font-weight:600;color:#0b1020;\">Ahoj,</p>\n                <p style=\"margin:0 0 28px;font-size:15px;line-height:1.7;color:#6b7280;\">Děkujeme za přihlášení k newsletteru CTRL Europe. Napíšeme, až bude něco nového ve skupinách, které jste zvolili.</p>\n                <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-bottom:28px;width:100%;\">\n                  <tr>\n                    <td class=\"email-summary\" style=\"background:#eff4ff;border:1px solid rgba(29,78,216,0.14);border-left:3px solid #1d4ed8;border-radius:8px;padding:20px 22px;\">\n                      <h2 style=\"margin:0 0 14px;font-size:13px;line-height:1.4;font-weight:700;color:#0b1020;\">Váš odběr</h2>\n                      <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;width:100%;\">\n                        <tr>\n                          <td class=\"email-row-label\" style=\"padding:10px 0;border-bottom:1px solid rgba(29,78,216,0.12);font-family:Geist Mono,Consolas,monospace;font-size:10px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;color:#1d4ed8;vertical-align:top;width:42%;\">Skupiny</td>\n                          <td class=\"email-row-value\" style=\"padding:10px 0 10px 16px;border-bottom:1px solid rgba(29,78,216,0.12);font-size:14px;line-height:1.5;color:#0b1020;font-weight:500;\">Aktuality</td>\n                        </tr>\n                      </table>\n                    </td>\n                  </tr>\n                </table>\n                <p style=\"margin:0 0 24px;font-size:15px;line-height:1.7;color:#0b1020;\">Skupiny můžete změnit opětovným odesláním formuláře, nebo se odhlásit tlačítkem níže.</p>\n                <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" style=\"width:auto;\">\n                  <tr>\n                    <td class=\"email-cta-cell\" style=\"border-radius:8px;background:#0b1020;\">\n                      <a class=\"email-cta-link\" href=\"https://ctrleurope.com\" style=\"display:inline-block;padding:14px 24px;font-size:14px;font-weight:600;color:#f5f5f3;text-decoration:none;\">Navštívit web &rarr;</a>\n                    </td>\n                    <td class=\"email-cta-cell\" style=\"padding-left:10px;\">\n                      <a class=\"email-cta-link\" href=\"{{unsubscribe_url}}\" style=\"display:inline-block;padding:14px 24px;font-size:14px;font-weight:600;color:#0b1020;text-decoration:none;border:1px solid rgba(11,16,32,0.18);border-radius:8px;\">Odhlásit odběr &rarr;</a>\n                    </td>\n                  </tr>\n                </table>\n              </td>\n            </tr>\n            <tr>\n              <td style=\"padding:28px 12px 0;text-align:center;\">\n                <p style=\"margin:0 0 8px;font-size:12px;line-height:1.6;color:#6b7280;\">Budujeme digitální odolnost pro novou evropskou generaci.</p>\n                <p style=\"margin:0;font-family:Geist Mono,Consolas,monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;\">CTRL Europe · <a href=\"https://ctrleurope.com\" style=\"color:#4a7bff;text-decoration:none;\">ctrleurope.com</a></p>\n              </td>\n            </tr>\n          </table>\n        </td>\n      </tr>\n    </table>\n  </body>\n</html>";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "https://ctrl-europe-portal.vercel.app",
]);

const ACTIONS = new Set([
  "templates",
  "template_create",
  "template_update",
  "template_delete",
  "count",
  "test",
  "send",
  "history",
]);

const TOPIC_GROUPS = ["workshops", "summit", "run", "partners", "media"];
const GROUPS = new Set([...TOPIC_GROUPS, "all"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 1000;
const DEFAULT_FROM = "CTRL Europe <noreply@ctrleurope.com>";
const DEFAULT_SITE = "https://ctrleurope.com";

type Subscriber = {
  email: string;
  lang: string;
  token: string;
};

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type, x-region");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Vary", "Origin");
  }
  return headers;
}

function json(status: number, body: unknown, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function cleanText(value: unknown, min: number, max: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length < min || text.length > max) return null;
  return text;
}

function isAllowedUrl(value: string, attr: string) {
  const trimmed = value.trim();
  if (attr === "href" && trimmed === "{{unsubscribe_url}}") return true;
  return /^https:\/\//i.test(trimmed) || /^http:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed);
}

function stripUnsubscribeTokens(html: string) {
  return html.replace(
    /(\/newsletter\/unsubscribe)(\?|&amp;|&)([^"'#<\s]*)/gi,
    (_full, path: string, _sep: string, query: string) => {
      const parts = query.replace(/&amp;/gi, "&").split("&").filter((part) => part && !/^token=/i.test(part));
      return parts.length ? `${path}?${parts.join("&")}` : path;
    },
  );
}

function sanitizeHtml(html: string) {
  const { document } = parseHTML(html);
  for (const tag of ["script", "iframe", "object", "embed", "form", "link", "meta"]) {
    document.querySelectorAll(tag).forEach((node: Element) => node.remove());
  }
  document.querySelectorAll("*").forEach((node: Element) => {
    for (const attr of [...node.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) {
        node.removeAttribute(attr.name);
        continue;
      }
      if ((name === "href" || name === "src") && !isAllowedUrl(attr.value, name)) {
        node.removeAttribute(attr.name);
      }
    }
  });
  const serialized = typeof document.toString === "function"
    ? document.toString()
    : document.documentElement?.outerHTML || "";
  return stripUnsubscribeTokens(serialized);
}

function siteUrl() {
  const raw = (Deno.env.get("SITE_URL") ?? DEFAULT_SITE).trim().replace(/\/$/, "");
  return raw || DEFAULT_SITE;
}

function normalizeTestEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254 || /\s/.test(email)) return null;
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return email;
}

function personalize(html: string, token: string, lang: string) {
  const trimmed = token.trim();
  if (!trimmed || !html.includes("{{unsubscribe_url}}")) return null;
  const url = `${siteUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(trimmed)}`;
  let out = html.split("{{unsubscribe_url}}").join(url);
  if (lang === "en") {
    out = out.replace(/<a\b([^>]*)>\s*Odhlásit odběr\s*<\/a>/gi, "<a$1>Unsubscribe</a>");
  }
  if (!out.includes(url) || !out.includes("/newsletter/unsubscribe?token=")) return null;
  return out;
}

function newsletterClient() {
  const url = Deno.env.get("NEWSLETTER_SUPABASE_URL");
  const key = Deno.env.get("NEWSLETTER_SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    console.error(!url ? "NEWSLETTER_SUPABASE_URL" : "NEWSLETTER_SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadSubscribers(supabase: ReturnType<typeof createClient>, group: string) {
  const seen = new Set<string>();
  const recipients: Subscriber[] = [];
  let from = 0;

  while (from < 200000) {
    let query = supabase
      .from("newsletter_subscribers")
      .select("email, lang, unsubscribe_token")
      .eq("status", "subscribed")
      .order("email", { ascending: true });
    query = group === "all"
      ? query.overlaps("preferences", TOPIC_GROUPS)
      : query.contains("preferences", [group]);
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("newsletter_subscribers", error.code ?? "query");
      throw error;
    }
    const rows = data ?? [];
    for (const row of rows) {
      const email = String(row.email ?? "").trim().toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      recipients.push({
        email,
        lang: String(row.lang ?? ""),
        token: String(row.unsubscribe_token ?? ""),
      });
    }
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return recipients;
}

async function sendBatches(messages: Array<{ to: string; subject: string; html: string }>, from: string, apiKey: string) {
  let sent = 0;
  let failed = 0;
  for (let index = 0; index < messages.length; index += 100) {
    const chunk = messages.slice(index, index + 100);
    try {
      const response = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk.map((message) => ({
          from,
          to: message.to,
          subject: message.subject,
          html: message.html,
        }))),
      });
      if (!response.ok) {
        failed += chunk.length;
        console.error("resend batch", response.status);
        continue;
      }
      sent += chunk.length;
    } catch {
      failed += chunk.length;
      console.error("resend batch failed");
    }
  }
  return { sent, failed };
}

async function writeSendLog(
  supabase: ReturnType<typeof createClient>,
  row: Record<string, unknown>,
) {
  const { error } = await supabase.from("newsletter_sends").insert(row);
  if (error) console.error("newsletter_sends", error.message);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return new Response("Forbidden", { status: 403 });
    }
    return new Response("ok", { status: 200, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" }, origin);
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json(403, { error: "Forbidden" }, null);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(!supabaseUrl ? "SUPABASE_URL" : "SUPABASE_SERVICE_ROLE_KEY");
    return json(500, { error: "Could not send" }, origin);
  }

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json(401, { error: "Unauthorized" }, origin);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) return json(401, { error: "Unauthorized" }, origin);

  const userId = userData.user.id;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("layer")
    .eq("id", userId)
    .maybeSingle();
  if (profileError || profile?.layer !== "admin") return json(403, { error: "Forbidden" }, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid" }, origin);
  }
  if (!body || typeof body !== "object" || !ACTIONS.has(String(body.action))) {
    return json(400, { error: "invalid" }, origin);
  }

  const action = String(body.action);

  if (action === "templates") {
    const { data: existing, error: existingError } = await supabase
      .from("newsletter_templates")
      .select("id")
      .limit(1);
    if (existingError) return json(500, { error: "failed" }, origin);

    if (!existing?.length) {
      let cleaned = "";
      try {
        cleaned = sanitizeHtml(WELCOME_HTML);
      } catch {
        return json(500, { error: "failed" }, origin);
      }
      const { error: insertError } = await supabase.from("newsletter_templates").insert({
        name: WELCOME_NAME,
        subject: WELCOME_SUBJECT,
        html: cleaned,
        created_by: userId,
      });
      if (insertError) return json(500, { error: "failed" }, origin);
    }

    const { data, error } = await supabase
      .from("newsletter_templates")
      .select("id, name, subject, html, updated_at")
      .order("updated_at", { ascending: false });
    if (error) return json(500, { error: "failed" }, origin);
    return json(200, { ok: true, templates: data ?? [] }, origin);
  }

  if (action === "template_create" || action === "template_update") {
    const name = cleanText(body.name, 1, 80);
    const subject = cleanText(body.subject, 1, 120);
    if (!name || !subject || typeof body.html !== "string") return json(400, { error: "invalid" }, origin);
    if (body.html.length < 1 || body.html.length > 100000 || !body.html.trim()) {
      return json(400, { error: "invalid" }, origin);
    }

    let cleaned = "";
    try {
      cleaned = sanitizeHtml(body.html);
    } catch {
      return json(400, { error: "invalid" }, origin);
    }
    if (!cleaned.trim() || cleaned.length > 100000) return json(400, { error: "invalid" }, origin);

    if (action === "template_create") {
      const { data, error } = await supabase
        .from("newsletter_templates")
        .insert({ name, subject, html: cleaned, created_by: userId })
        .select("id, name, subject, html, updated_at")
        .single();
      if (error || !data) return json(500, { error: "failed" }, origin);
      return json(200, { ok: true, template: data }, origin);
    }

    if (!isUuid(body.id)) return json(400, { error: "invalid" }, origin);
    const { data, error } = await supabase
      .from("newsletter_templates")
      .update({
        name,
        subject,
        html: cleaned,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select("id, name, subject, html, updated_at");
    if (error) return json(500, { error: "failed" }, origin);
    if (!data?.length) return json(404, { error: "not_found" }, origin);
    return json(200, { ok: true, template: data[0] }, origin);
  }

  if (action === "template_delete") {
    if (!isUuid(body.id)) return json(400, { error: "invalid" }, origin);
    const { data, error } = await supabase
      .from("newsletter_templates")
      .delete()
      .eq("id", body.id)
      .select("id");
    if (error) return json(500, { error: "failed" }, origin);
    if (!data?.length) return json(404, { error: "not_found" }, origin);
    return json(200, { ok: true }, origin);
  }

  if (action === "history") {
    const { data, error } = await supabase
      .from("newsletter_sends")
      .select("created_at, mode, group_key, subject, template_name, recipient_count, sent_count, failed_count")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return json(500, { error: "failed" }, origin);
    return json(200, { ok: true, history: data ?? [] }, origin);
  }

  if (!GROUPS.has(String(body.group))) {
    return json(400, { error: "invalid" }, origin);
  }
  const group = String(body.group);

  const subscribers = newsletterClient();
  if (!subscribers) return json(500, { error: "Could not send" }, origin);

  let recipients: Subscriber[];
  try {
    recipients = await loadSubscribers(subscribers, group);
  } catch {
    return json(500, { error: "failed" }, origin);
  }

  if (action === "count") {
    return json(200, { ok: true, count: recipients.length }, origin);
  }

  const subject = cleanText(body.subject, 1, 120);
  if (!subject || typeof body.html !== "string" || !body.html.trim() || body.html.length > 100000) {
    return json(400, { error: "invalid" }, origin);
  }

  let cleaned = "";
  try {
    cleaned = sanitizeHtml(body.html);
  } catch {
    return json(400, { error: "invalid" }, origin);
  }
  if (!cleaned.trim() || cleaned.length > 100000) return json(400, { error: "invalid" }, origin);

  if (!cleaned.includes("{{unsubscribe_url}}")) {
    return json(400, { error: "missing_unsubscribe" }, origin);
  }

  let templateId: string | null = null;
  let templateName = "Bez šablony";
  if (body.templateId !== undefined && body.templateId !== null && body.templateId !== "") {
    if (!isUuid(body.templateId)) return json(400, { error: "invalid" }, origin);
    const { data: template, error: templateError } = await supabase
      .from("newsletter_templates")
      .select("id, name")
      .eq("id", body.templateId)
      .maybeSingle();
    if (templateError) return json(500, { error: "failed" }, origin);
    if (!template) return json(404, { error: "not_found" }, origin);
    templateId = template.id;
    templateName = template.name;
  }

  if (action === "test") {
    const testEmail = normalizeTestEmail(body.testEmail);
    if (!testEmail) return json(400, { error: "invalid" }, origin);
    const match = recipients.find((recipient) => recipient.email === testEmail);
    if (!match) return json(404, { error: "not_in_group" }, origin);
    recipients = [match];
  } else if (action === "send") {
    if (body.confirm !== true) return json(400, { error: "invalid" }, origin);
    if (recipients.length === 0) return json(400, { error: "empty" }, origin);
  } else {
    return json(400, { error: "invalid" }, origin);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("RESEND_API_KEY");
    return json(500, { error: "Could not send" }, origin);
  }

  const from = Deno.env.get("RESEND_FROM_EMAIL")?.trim() || DEFAULT_FROM;
  const messages: Array<{ to: string; subject: string; html: string }> = [];
  let failed = 0;
  for (const recipient of recipients) {
    const html = personalize(cleaned, recipient.token, recipient.lang);
    if (!html) {
      failed += 1;
      continue;
    }
    messages.push({ to: recipient.email, subject, html });
  }

  const batch = await sendBatches(messages, from, resendKey);
  const sent = batch.sent;
  failed += batch.failed;

  await writeSendLog(supabase, {
    sent_by: userId,
    template_id: templateId,
    template_name: templateName,
    mode: action,
    group_key: group,
    subject,
    recipient_count: action === "test" ? 1 : recipients.length,
    sent_count: sent,
    failed_count: failed,
  });

  return json(200, { ok: true, sent, failed }, origin);
});
