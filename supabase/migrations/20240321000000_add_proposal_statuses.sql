-- Create proposal_statuses table
CREATE TABLE IF NOT EXISTS proposal_statuses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on proposal_statuses
ALTER TABLE proposal_statuses ENABLE ROW LEVEL SECURITY;

-- Create policies for proposal_statuses
CREATE POLICY "Proposal statuses are viewable by authenticated users"
    ON proposal_statuses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Proposal statuses are editable by admin users"
    ON proposal_statuses FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Insert initial proposal statuses
INSERT INTO proposal_statuses (name, description) VALUES
    ('Edit', 'Proposal is in draft/edit mode'),
    ('Review', 'Proposal is under review'),
    ('Approved', 'Proposal has been approved internally'),
    ('Published', 'Proposal has been published to client'),
    ('Active', 'Proposal has been accepted by client'),
    ('On Hold', 'Proposal is temporarily on hold'),
    ('Cancelled', 'Proposal has been cancelled')
ON CONFLICT (name) DO NOTHING;

-- Add status_id column to fee_proposals
ALTER TABLE fee_proposals 
    ADD COLUMN status_id uuid REFERENCES proposal_statuses(id);

-- Update existing status values to use status_id
UPDATE fee_proposals fp
SET status_id = ps.id
FROM proposal_statuses ps
WHERE fp.status = ps.name;

-- Make status_id NOT NULL after data migration
ALTER TABLE fee_proposals 
    ALTER COLUMN status_id SET NOT NULL;

-- Drop the old status column
ALTER TABLE fee_proposals 
    DROP COLUMN status;

-- Add trigger to update updated_at
CREATE TRIGGER update_proposal_statuses_updated_at
    BEFORE UPDATE ON proposal_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 