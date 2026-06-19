-- Calls send-push Edge Function after each notification insert.
-- Requires pg_net and a Vault secret named "service_role_key" (see docs/PUSH_SETUP.md).

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_send_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_key text;
  project_url text := 'https://sevkgwnviddgffkovwba.supabase.co';
BEGIN
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF service_key IS NULL THEN
    RAISE WARNING 'send-push: vault secret service_role_key not configured';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'notifications',
      'schema', 'public',
      'record', row_to_json(NEW)
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'send-push trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_notification_insert_send_push ON public.notifications;
CREATE TRIGGER on_notification_insert_send_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_send_push();
