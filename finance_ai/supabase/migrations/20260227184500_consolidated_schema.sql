
-- Consolidated Migration to fix schema inconsistencies

-- 1. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  employment_type TEXT,
  age_group TEXT,
  tax_regime TEXT,
  income_sources TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- 3. Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'uploaded',
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6. Financial data table
CREATE TABLE IF NOT EXISTS public.financial_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL DEFAULT '2025-26',
  -- Income fields
  gross_salary NUMERIC DEFAULT 0,
  hra_received NUMERIC DEFAULT 0,
  lta_received NUMERIC DEFAULT 0,
  other_income NUMERIC DEFAULT 0,
  rental_income NUMERIC DEFAULT 0,
  interest_income NUMERIC DEFAULT 0,
  business_income NUMERIC DEFAULT 0,
  -- Deduction fields
  deductions_80c NUMERIC DEFAULT 0,
  deductions_80d NUMERIC DEFAULT 0,
  deductions_80e NUMERIC DEFAULT 0,
  deductions_80g NUMERIC DEFAULT 0,
  deductions_nps NUMERIC DEFAULT 0,
  deductions_hra NUMERIC DEFAULT 0,
  deductions_lta NUMERIC DEFAULT 0,
  standard_deduction NUMERIC DEFAULT 75000,
  other_deductions NUMERIC DEFAULT 0,
  -- Metadata
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, financial_year)
);

ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own financial data" ON public.financial_data FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own financial data" ON public.financial_data FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own financial data" ON public.financial_data FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own financial data" ON public.financial_data FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_financial_data_updated_at ON public.financial_data;
CREATE TRIGGER update_financial_data_updated_at
  BEFORE UPDATE ON public.financial_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 7. Tax analyses table
CREATE TABLE IF NOT EXISTS public.tax_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL DEFAULT '2025-26',
  old_regime_tax NUMERIC DEFAULT 0,
  new_regime_tax NUMERIC DEFAULT 0,
  recommended_regime TEXT,
  analysis_summary TEXT,
  deduction_suggestions JSONB,
  scheme_recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, financial_year)
);

ALTER TABLE public.tax_analyses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own tax analyses" ON public.tax_analyses FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own tax analyses" ON public.tax_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own tax analyses" ON public.tax_analyses FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own tax analyses" ON public.tax_analyses FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN others THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_tax_analyses_updated_at ON public.tax_analyses;
CREATE TRIGGER update_tax_analyses_updated_at
  BEFORE UPDATE ON public.tax_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tax-documents', 'tax-documents', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Users can upload own documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tax-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT USING (bucket_id = 'tax-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE USING (bucket_id = 'tax-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN others THEN NULL; END $$;
