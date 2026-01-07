-- Create a function to handle new reminders
CREATE OR REPLACE FUNCTION public.handle_new_reminder()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'تذكير جديد: ' || NEW.title,
    coalesce(NEW.description, 'لديك تذكير جديد'),
    'reminder'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_reminder_created ON public.reminders;
CREATE TRIGGER on_reminder_created
  AFTER INSERT ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_reminder();
