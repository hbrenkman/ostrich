-- Create the reference_tables table
CREATE TABLE IF NOT EXISTS public.reference_tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    entries JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.reference_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all authenticated users" ON public.reference_tables
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow insert/update/delete for admin users" ON public.reference_tables
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Insert industry data
INSERT INTO public.reference_tables (name, category, description, entries)
VALUES (
    'Industries',
    'Project Types',
    'List of industry types for companies',
    '[
        {"id": "1", "key": "ARCH", "value": "Architecture", "description": "Architecture firms and services"},
        {"id": "2", "key": "ENG", "value": "Engineering", "description": "Engineering firms and services"},
        {"id": "3", "key": "CONST", "value": "Construction", "description": "Construction companies and contractors"},
        {"id": "4", "key": "RE", "value": "Real Estate", "description": "Real estate development and management"},
        {"id": "5", "key": "TECH", "value": "Technology", "description": "Technology companies and services"},
        {"id": "6", "key": "HEALTH", "value": "Healthcare", "description": "Healthcare providers and services"},
        {"id": "7", "key": "MFG", "value": "Manufacturing", "description": "Manufacturing companies and facilities"},
        {"id": "8", "key": "EDU", "value": "Education", "description": "Educational institutions and services"},
        {"id": "9", "key": "GOV", "value": "Government", "description": "Government agencies and services"},
        {"id": "10", "key": "NONPROFIT", "value": "Non-Profit", "description": "Non-profit organizations"},
        {"id": "11", "key": "RETAIL", "value": "Retail", "description": "Retail businesses and services"},
        {"id": "12", "key": "HOSP", "value": "Hospitality", "description": "Hotels, restaurants, and hospitality services"},
        {"id": "13", "key": "FIN", "value": "Financial", "description": "Financial services and institutions"},
        {"id": "14", "key": "UTIL", "value": "Utilities", "description": "Utility companies and services"},
        {"id": "15", "key": "TRANS", "value": "Transportation", "description": "Transportation and logistics services"},
        {"id": "16", "key": "MEDIA", "value": "Media", "description": "Media and entertainment companies"},
        {"id": "17", "key": "OTHER", "value": "Other", "description": "Other industry types"}
    ]'::jsonb
); 