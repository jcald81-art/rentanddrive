-- Create filing-cabinet storage bucket and documents table
-- Run this migration to set up secure document storage for RentAndDrive

-- Platform manager emails (hard-coded for security)
-- caldwell_joey@hotmail.com and jcald81@gmail.com

-- 1. Create the documents metadata table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('drivers_license', 'insurance_card', 'vehicle_registration', 'proof_of_insurance', 'vehicle_photo', 'profile_photo', 'other')),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  expiration_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_vehicle_id ON public.documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

-- 3. Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for documents table

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
ON public.documents FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR 
  auth.jwt()->>'email' IN ('caldwell_joey@hotmail.com', 'jcald81@gmail.com')
);

-- Users can insert their own documents
CREATE POLICY "Users can insert own documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own documents (except verified status)
CREATE POLICY "Users can update own documents"
ON public.documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Platform managers can update any document
CREATE POLICY "Platform managers can update any document"
ON public.documents FOR UPDATE
TO authenticated
USING (auth.jwt()->>'email' IN ('caldwell_joey@hotmail.com', 'jcald81@gmail.com'))
WITH CHECK (auth.jwt()->>'email' IN ('caldwell_joey@hotmail.com', 'jcald81@gmail.com'));

-- Users can delete their own pending documents
CREATE POLICY "Users can delete own pending documents"
ON public.documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Platform managers can delete any document
CREATE POLICY "Platform managers can delete any document"
ON public.documents FOR DELETE
TO authenticated
USING (auth.jwt()->>'email' IN ('caldwell_joey@hotmail.com', 'jcald81@gmail.com'));

-- 5. Add is_suspended column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_suspended'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'suspended_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN suspended_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'suspended_reason'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN suspended_reason TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'suspended_by'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN suspended_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 6. Create updated_at trigger for documents
CREATE OR REPLACE FUNCTION public.handle_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_documents_updated_at();

-- 7. Create platform_audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'vehicle', 'booking', 'document')),
  target_id UUID NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON public.platform_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON public.platform_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.platform_audit_log(created_at DESC);

-- Enable RLS on audit log
ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;

-- Only platform managers can view audit log
CREATE POLICY "Platform managers can view audit log"
ON public.platform_audit_log FOR SELECT
TO authenticated
USING (auth.jwt()->>'email' IN ('caldwell_joey@hotmail.com', 'jcald81@gmail.com'));

-- Only platform managers can insert audit log entries
CREATE POLICY "Platform managers can insert audit log"
ON public.platform_audit_log FOR INSERT
TO authenticated
WITH CHECK (auth.jwt()->>'email' IN ('caldwell_joey@hotmail.com', 'jcald81@gmail.com'));
