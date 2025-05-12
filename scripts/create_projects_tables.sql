-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Design', 'Construction', 'Hold', 'Cancelled')),
    company_id UUID REFERENCES companies(id) ON DELETE RESTRICT,
    company_location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
    company_contact_id UUID REFERENCES contacts(id) ON DELETE RESTRICT,
    project_location_address TEXT,
    project_location_city TEXT,
    project_location_state TEXT,
    project_location_zip TEXT,
    project_location_country TEXT DEFAULT 'USA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create project_team_members table for many-to-many relationship
CREATE TABLE IF NOT EXISTS project_team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    is_project_manager BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- Create fee_proposals table
CREATE TABLE IF NOT EXISTS fee_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    overview TEXT,
    design_budget DECIMAL(12,2),
    construction_support_budget DECIMAL(12,2),
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Active', 'On Hold', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(project_id, number)
);

-- Create project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('CityComments', 'Addenda', 'RFI', 'FieldReview', 'PunchList')),
    number TEXT NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Issued', 'Responded', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(project_id, type, number)
);

-- Create RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view projects they are team members of"
    ON projects FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_team_members
            WHERE project_team_members.project_id = projects.id
            AND project_team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all projects"
    ON projects FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can insert projects"
    ON projects FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can update projects"
    ON projects FOR UPDATE
    USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can delete projects"
    ON projects FOR DELETE
    USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Project team members policies
CREATE POLICY "Users can view team members of their projects"
    ON project_team_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_team_members.project_id
            AND EXISTS (
                SELECT 1 FROM project_team_members ptm
                WHERE ptm.project_id = projects.id
                AND ptm.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can manage team members"
    ON project_team_members FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Fee proposals policies
CREATE POLICY "Users can view fee proposals of their projects"
    ON fee_proposals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = fee_proposals.project_id
            AND EXISTS (
                SELECT 1 FROM project_team_members
                WHERE project_team_members.project_id = projects.id
                AND project_team_members.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can manage fee proposals"
    ON fee_proposals FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Project documents policies
CREATE POLICY "Users can view documents of their projects"
    ON project_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_documents.project_id
            AND EXISTS (
                SELECT 1 FROM project_team_members
                WHERE project_team_members.project_id = projects.id
                AND project_team_members.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can manage project documents"
    ON project_documents FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_team_members_updated_at
    BEFORE UPDATE ON project_team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_proposals_updated_at
    BEFORE UPDATE ON fee_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_documents_updated_at
    BEFORE UPDATE ON project_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 