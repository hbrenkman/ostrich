-- Create enum for document status if not exists
CREATE TYPE document_status AS ENUM ('active', 'expired', 'pending', 'rejected');

-- Create the employee_document_types table
CREATE TABLE IF NOT EXISTS employee_document_types (
    document_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    requires_expiration BOOLEAN DEFAULT false,
    requires_verification BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common document types
INSERT INTO employee_document_types (code, name, description, requires_expiration, requires_verification) VALUES
    ('I9', 'I-9 Form', 'Employment Eligibility Verification Form', false, true),
    ('EVERIFY', 'E-Verify Confirmation', 'Electronic Employment Eligibility Verification', false, true),
    ('NEWHIRE', 'State New Hire Report', 'State-mandated new hire reporting document', false, false),
    ('DRIVERS_LICENSE', 'Driver''s License', 'State-issued driver''s license', true, true),
    ('PASSPORT', 'Passport', 'U.S. or foreign passport', true, true),
    ('SSN_CARD', 'Social Security Card', 'Social Security Administration card', false, true),
    ('BIRTH_CERT', 'Birth Certificate', 'Official birth certificate', false, true),
    ('WORK_PERMIT', 'Work Permit', 'Authorization to work in the U.S.', true, true),
    ('PROF_LICENSE', 'Professional License', 'State-issued professional license', true, true),
    ('CERTIFICATION', 'Professional Certification', 'Industry or professional certification', true, false),
    ('RESUME', 'Resume', 'Professional resume or CV', false, false),
    ('REFERENCE', 'Reference Letter', 'Professional reference letter', false, false),
    ('BACKGROUND', 'Background Check', 'Criminal background check results', false, true),
    ('DRUG_TEST', 'Drug Test', 'Pre-employment drug test results', false, true),
    ('HEALTH_CERT', 'Health Certification', 'Health or medical certification', true, false),
    ('TAX_W4', 'W-4 Form', 'Employee''s Withholding Certificate', false, false),
    ('DIRECT_DEPOSIT', 'Direct Deposit Form', 'Bank account information for payroll', false, false),
    ('EMERGENCY_CONTACT', 'Emergency Contact Form', 'Emergency contact information', false, false),
    ('BENEFITS_ENROLL', 'Benefits Enrollment', 'Benefits enrollment documentation', false, false),
    ('NDA', 'Non-Disclosure Agreement', 'Confidentiality agreement', false, false);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_document_types_updated_at
    BEFORE UPDATE ON employee_document_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE employee_document_types ENABLE ROW LEVEL SECURITY;

-- Policy for viewing document types (any authenticated user can view)
CREATE POLICY "Allow authenticated users to view document types"
    ON employee_document_types
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for managing document types (only service role can modify)
CREATE POLICY "Allow service role to manage document types"
    ON employee_document_types
    USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX idx_employee_document_types_code ON employee_document_types(code);
CREATE INDEX idx_employee_document_types_is_active ON employee_document_types(is_active); 