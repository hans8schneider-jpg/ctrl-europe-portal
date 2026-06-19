import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import webpush from "npm:web-push@3.6.7";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  bucket_target?: string | null;
  user_target?: string | null;
  ref_id?: string | null;
  created_by?: string | null;
  push_only?: boolean | null;
};

type ProfileRow = {
  id: string;
  bucket?: string | null;
  secondary_bucket?: string | null;
  notify_push_tasks?: boolean | null;
  notify_push_news?: boolean | null;
  notify_push_events?: boolean | null;
  notify_push_mentions?: boolean | null;
  notify_push_chat?: boolean | null;
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function bucketToSlug(bucket: string) {
  return stripDiacritics(bucket)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function notificationVisibleToProfile(notification: NotificationRow, profile: ProfileRow) {
  if (!profile || !notification) return false;

  if (notification.user_target) {
    return String(notification.user_target) === String(profile.id);
  }

  const target = notification.bucket_target;
  if (!target || target === "all") return true;

  const buckets = [profile.bucket, profile.secondary_bucket].filter(Boolean) as string[];
  return buckets.includes(target);
}

function pushAllowedForProfile(notification: NotificationRow, profile: ProfileRow) {
  switch (notification.type) {
    case "task":
      return profile.notify_push_tasks !== false;
    case "news":
      return profile.notify_push_news !== false;
    case "event":
      return profile.notify_push_events !== false;
    case "mention":
      return profile.notify_push_mentions !== false;
    case "chat":
      return profile.notify_push_chat === true;
    default:
      return true;
  }
}

function notificationUrl(notification: NotificationRow, portalUrl: string) {
  const base = portalUrl.replace(/\/$/, "");
  const { type, bucket_target: bucketTarget } = notification;

  if ((type === "task" || type === "mention" || type === "chat") && bucketTarget) {
    return `${base}/bunka/${bucketToSlug(bucketTarget)}`;
  }

  return `${base}/`;
}

function getNotificationFromPayload(payload: Record<string, unknown>): NotificationRow | null {
  const record = (payload.record ?? payload) as NotificationRow;
  if (!record?.id || !record?.title) return null;
  return record;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:notify@ctrleurope.team";
  const portalUrl = Deno.env.get("PORTAL_URL") ?? "https://ctrl-europe-portal.vercel.app";

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: "Missing server configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const notification = getNotificationFromPayload(payload);
  if (!notification) {
    return new Response(JSON.stringify({ error: "Missing notification record" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const [{ data: subscriptions, error: subscriptionsError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      supabase.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth"),
      supabase.from("profiles").select("*"),
    ]);

  if (subscriptionsError || profilesError) {
    console.error("fetch error", subscriptionsError, profilesError);
    return new Response(JSON.stringify({ error: "Failed to load recipients" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [String(profile.id), profile as ProfileRow]),
  );

  const pushPayload = JSON.stringify({
    title: notification.title,
    body: notification.body ?? "",
    url: notificationUrl(notification, portalUrl),
    tag: `notification-${notification.id}`,
  });

  let sent = 0;
  let skipped = 0;
  const staleSubscriptionIds: string[] = [];

  for (const row of (subscriptions ?? []) as PushSubscriptionRow[]) {
    const profile = profileById.get(String(row.user_id));
    if (!profile || !notificationVisibleToProfile(notification, profile)) {
      skipped += 1;
      continue;
    }

    if (!pushAllowedForProfile(notification, profile)) {
      skipped += 1;
      continue;
    }

    if (notification.created_by && String(notification.created_by) === String(row.user_id)) {
      skipped += 1;
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        },
        pushPayload,
      );
      sent += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      console.error("push failed", row.endpoint, error);
      if (statusCode === 404 || statusCode === 410) {
        staleSubscriptionIds.push(row.id);
      }
    }
  }

  if (staleSubscriptionIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleSubscriptionIds);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      sent,
      skipped,
      removed: staleSubscriptionIds.length,
      notification_id: notification.id,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
