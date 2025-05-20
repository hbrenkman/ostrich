-- Create enum for document status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('active', 'expired', 'pending', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the employee_compliance_documents table
CREATE TABLE IF NOT EXISTS public.employee_compliance_documents (
    document_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(employee_id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES public.employee_document_types(document_type_id),
    document_number VARCHAR(100),
    file_url TEXT,
    issue_date DATE NOT NULL,
    expiration_date DATE,
    status document_status DEFAULT 'pending',
    verification_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employee_compliance_documents_employee_id 
    ON public.employee_compliance_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_compliance_documents_document_type_id 
    ON public.employee_compliance_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_compliance_documents_status 
    ON public.employee_compliance_documents(status);
CREATE INDEX IF NOT EXISTS idx_employee_compliance_documents_expiration_date 
    ON public.employee_compliance_documents(expiration_date);

-- Add RLS policies
ALTER TABLE public.employee_compliance_documents ENABLE ROW LEVEL SECURITY;

-- Policy for viewing documents (authenticated users can view)
CREATE POLICY "Authenticated users can view compliance documents"
    ON public.employee_compliance_documents
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for inserting documents (authenticated users can insert)
CREATE POLICY "Authenticated users can insert compliance documents"
    ON public.employee_compliance_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy for updating documents (authenticated users can update)
CREATE POLICY "Authenticated users can update compliance documents"
    ON public.employee_compliance_documents
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for deleting documents (authenticated users can delete)
CREATE POLICY "Authenticated users can delete compliance documents"
    ON public.employee_compliance_documents
    FOR DELETE
    TO authenticated
    USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.employee_compliance_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 