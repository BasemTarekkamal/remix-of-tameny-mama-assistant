-- Enable the pg_net extension to allow invoking Edge Functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add push_token column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'push_token') THEN
        ALTER TABLE public.profiles ADD COLUMN push_token text;
    END IF;
END $$;

-- Create a function to invoke the push Edge Function
CREATE OR REPLACE FUNCTION public.invoke_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_push_token text;
BEGIN
  -- Get the push token for the user from the profiles table
  SELECT push_token INTO recipient_push_token
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- If a token exists, invoke the Edge Function
  IF recipient_push_token IS NOT NULL THEN
    -- We use pg_net to make an async HTTP request
    -- NOTE: You need to replace SUPABASE_URL and SUPABASE_ANON_KEY with your actual values
    -- or ensure they are available as secrets/env vars if running in a managed environment that supports it.
    -- However, pg_net inside Supabase usually requires the full URL.
    -- For local development or if using current project URL:
    -- We will use the 'vault' or just construct the URL if we know it. 
    -- Since we can't easily access secrets in SQL without vault, we'll try to use a generic approach 
    -- OR rely on the user to check this. 
    -- BUT, `pg_net` is often restricted.
    
    -- ALTERNATIVE: Use `supabase_functions.http_request` if available or `net.http_post`.
    -- Assuming `net` schema from `pg_net`.

    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'token', recipient_push_token,
        'title', NEW.title,
        'message', NEW.message
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on notifications table
DROP TRIGGER IF EXISTS on_notification_created_push ON public.notifications;
CREATE TRIGGER on_notification_created_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.invoke_push_notification();
