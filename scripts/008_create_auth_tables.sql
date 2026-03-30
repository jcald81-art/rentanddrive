-- Profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_host BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  host_rating DECIMAL(2,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view any profile" ON public.profiles;
CREATE POLICY "Users can view any profile" ON public.profiles 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, is_host)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::text = 'host', false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Driver verifications table
CREATE TABLE IF NOT EXISTS public.driver_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_front_url TEXT NOT NULL,
  license_back_url TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_state TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on driver_verifications
ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;

-- Driver verifications policies
DROP POLICY IF EXISTS "Users can view their own verifications" ON public.driver_verifications;
CREATE POLICY "Users can view their own verifications" ON public.driver_verifications 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit their own verifications" ON public.driver_verifications;
CREATE POLICY "Users can submit their own verifications" ON public.driver_verifications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all verifications" ON public.driver_verifications;
CREATE POLICY "Admins can view all verifications" ON public.driver_verifications 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_host = true
    )
  );

DROP POLICY IF EXISTS "Admins can update verifications" ON public.driver_verifications;
CREATE POLICY "Admins can update verifications" ON public.driver_verifications 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_host = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_driver_verifications_user_id ON public.driver_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_verifications_status ON public.driver_verifications(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_host ON public.profiles(is_host);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);

-- Create storage buckets (run in Supabase dashboard SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('verifications', 'verifications', false);
