-- Fix: Ensure profiles.email is always populated from auth.users

-- Backfill any NULL emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- Add NOT NULL constraint (safe after backfill)
ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;

-- Update trigger to ensure email is always captured
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
