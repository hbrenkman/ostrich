/*
  # Create employee_compensation table

  1. New Tables
    - `employee_compensation`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `salary` (numeric, not null)
      - `bonus` (numeric)
      - `pay_grade` (text)
      - `pay_frequency` (text, not null)
      - `effective_date` (date, not null)
      - `end_date` (date)
      - `overtime_eligible` (boolean, default false)
      - `tax_withholding_status` (text)
      - `bank_account_number` (text)
      - `bank_routing_number` (text)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `created_by` (uuid, references auth.users)
      - `updated_by` (uuid, references auth.users)
  2. Security
    - Enable RLS on `employee_compensation` table
    - Add policy for authenticated users to read all compensation
    - Add policy for admin and project_management users to insert, update, and delete compensation
*/

-- Create employee_compensation table
CREATE TABLE IF NOT EXISTS employee_compensation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  salary numeric NOT NULL,
  bonus numeric,
  pay_grade text,
  pay_frequency text NOT NULL,
  effective_date date NOT NULL,
  end_date date,
  overtime_eligible boolean DEFAULT false,
  tax_withholding_status text,
  bank_account_number text,
  bank_routing_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS employee_compensation_employee_id_idx ON employee_compensation(employee_id);
CREATE INDEX IF NOT EXISTS employee_compensation_effective_date_idx ON employee_compensation(effective_date);

-- Enable Row Level Security
ALTER TABLE employee_compensation ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Select policy - Allow authenticated users to view all compensation
CREATE POLICY "Employee compensation is viewable by authenticated users"
  ON employee_compensation
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert policy - Allow admin and project_management users to insert compensation
CREATE POLICY "Employee compensation is editable by admin and project_management users"
  ON employee_compensation
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(ARRAY['admin', 'project_management'])
  );

-- Update policy - Allow admin and project_management users to update compensation
CREATE POLICY "Employee compensation is updatable by admin and project_management users"
  ON employee_compensation
  FOR UPDATE
  TO authenticated
  USING (
    has_role(ARRAY['admin', 'project_management'])
  )
  WITH CHECK (
    has_role(ARRAY['admin', 'project_management'])
  );

-- Delete policy - Allow only admin users to delete compensation
CREATE POLICY "Employee compensation is deletable by admin users"
  ON employee_compensation
  FOR DELETE
  TO authenticated
  USING (has_role(ARRAY['admin']));

-- Create trigger to update the updated_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employee_compensation_updated_at') THEN
    CREATE TRIGGER update_employee_compensation_updated_at
    BEFORE UPDATE ON employee_compensation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add comments to explain the table and its columns
COMMENT ON TABLE employee_compensation IS 'Stores employee compensation information including salary, bonus, and banking details';
COMMENT ON COLUMN employee_compensation.salary IS 'Annual salary amount';
COMMENT ON COLUMN employee_compensation.bonus IS 'Optional bonus amount';
COMMENT ON COLUMN employee_compensation.pay_grade IS 'Employee pay grade or level';
COMMENT ON COLUMN employee_compensation.pay_frequency IS 'Frequency of pay (e.g., Bi-weekly, Monthly)';
COMMENT ON COLUMN employee_compensation.effective_date IS 'Date when the compensation becomes effective';
COMMENT ON COLUMN employee_compensation.end_date IS 'Optional end date for the compensation';
COMMENT ON COLUMN employee_compensation.overtime_eligible IS 'Whether the employee is eligible for overtime pay';
COMMENT ON COLUMN employee_compensation.tax_withholding_status IS 'Employee tax withholding status (e.g., Single, Married, Exempt)';
COMMENT ON COLUMN employee_compensation.bank_account_number IS 'Employee bank account number for direct deposit';
COMMENT ON COLUMN employee_compensation.bank_routing_number IS 'Employee bank routing number for direct deposit'; 