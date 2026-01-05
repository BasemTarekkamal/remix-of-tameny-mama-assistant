-- Create child_vaccinations table
CREATE TABLE IF NOT EXISTS public.child_vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(child_id, vaccine_name)
);

-- Enable RLS
ALTER TABLE public.child_vaccinations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Parents can view their children's vaccinations"
ON public.child_vaccinations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.children
    WHERE children.id = child_vaccinations.child_id
    AND children.parent_id = auth.uid()
  )
);

CREATE POLICY "Parents can update their children's vaccinations"
ON public.child_vaccinations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.children
    WHERE children.id = child_vaccinations.child_id
    AND children.parent_id = auth.uid()
  )
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);
