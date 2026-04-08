-- P409: Techne Institute Database Schema Migration
-- Date: 2026-04-08
-- Supabase Instance: gxyeobogqfubgzklmxwt.supabase.co

-- ============================================================
-- TREASURY TABLES (Enhanced for API Integration)
-- ============================================================

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution text NOT NULL,
  account_name text NOT NULL,
  account_type text CHECK (account_type IN ('checking', 'savings', 'investment')) NOT NULL,
  balance numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  external_provider text, -- 'mercury', 'stripe', 'manual'
  external_account_id text, -- Provider's account ID
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES bank_accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  category text, -- 'income', 'expense', 'capital_call', 'distribution'
  project_id uuid, -- Will reference projects after that table is created
  external_id text UNIQUE, -- Provider transaction ID (prevents duplicates)
  external_provider text, -- 'mercury', 'stripe', 'manual'
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);

-- ============================================================
-- PROJECTS & VENTURES
-- ============================================================

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text CHECK (type IN ('project', 'venture')) NOT NULL,
  status text CHECK (status IN ('active', 'paused', 'completed', 'archived')) DEFAULT 'active',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project participants (many-to-many)
CREATE TABLE IF NOT EXISTS project_participants (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text, -- 'lead', 'contributor', 'advisor'
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, participant_id)
);

-- Project milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  status text CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Now add foreign key for transactions -> projects
ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_project
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE SET NULL;

-- ============================================================
-- CAPITAL ACCOUNTS
-- ============================================================

-- Capital accounts (member equity tracking)
CREATE TABLE IF NOT EXISTS capital_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES profiles(id) UNIQUE NOT NULL,
  initial_contribution numeric DEFAULT 0,
  labor_contributions numeric DEFAULT 0,
  capital_contributions numeric DEFAULT 0,
  patronage_allocated numeric DEFAULT 0,
  draws_taken numeric DEFAULT 0,
  current_balance numeric GENERATED ALWAYS AS (
    initial_contribution + labor_contributions + capital_contributions
    + patronage_allocated - draws_taken
  ) STORED,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Capital transactions (audit trail)
CREATE TABLE IF NOT EXISTS capital_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES capital_accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text CHECK (type IN ('initial', 'labor', 'capital', 'patronage', 'draw')) NOT NULL,
  amount numeric NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capital_transactions_account ON capital_transactions(account_id, date DESC);

-- ============================================================
-- LABOR TRACKING
-- ============================================================

-- Labor contributions
CREATE TABLE IF NOT EXISTS labor_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  hours numeric NOT NULL CHECK (hours > 0),
  hourly_rate numeric NOT NULL CHECK (hourly_rate > 0),
  fmv_total numeric GENERATED ALWAYS AS (hours * hourly_rate) STORED,
  description text,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  category text, -- 'governance', 'operations', 'project_work', 'community'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_labor_member_date ON labor_contributions(member_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_labor_project ON labor_contributions(project_id) WHERE project_id IS NOT NULL;

-- ============================================================
-- ENHANCED PROFILES
-- ============================================================

-- Add columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_class integer CHECK (membership_class IN (1, 2, 3, 4));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS craft text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_contributions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TREASURY RLS (Organizers only)
-- ============================================================

CREATE POLICY organizers_full_access_bank_accounts ON bank_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

CREATE POLICY organizers_full_access_transactions ON transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

-- ============================================================
-- PROJECTS RLS (All members read, organizers write)
-- ============================================================

CREATE POLICY all_members_read_projects ON projects
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY organizers_manage_projects ON projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

CREATE POLICY all_members_read_participants ON project_participants
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY organizers_manage_participants ON project_participants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

CREATE POLICY all_members_read_milestones ON project_milestones
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY organizers_manage_milestones ON project_milestones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

-- ============================================================
-- CAPITAL ACCOUNTS RLS (Members see own, organizers see all)
-- ============================================================

CREATE POLICY own_capital_account ON capital_accounts
  FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY organizers_all_capital_accounts ON capital_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

CREATE POLICY own_capital_transactions ON capital_transactions
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM capital_accounts WHERE member_id = auth.uid()
    )
  );

CREATE POLICY organizers_all_capital_transactions ON capital_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

-- ============================================================
-- LABOR RLS (Members manage own, organizers see all)
-- ============================================================

CREATE POLICY own_labor_contributions ON labor_contributions
  FOR ALL
  USING (member_id = auth.uid());

CREATE POLICY organizers_all_labor_contributions ON labor_contributions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.declared_role = 'organizer'
    )
  );

-- ============================================================
-- TRIGGERS (Auto-update timestamps)
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON project_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capital_accounts_updated_at BEFORE UPDATE ON capital_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMMENTS (Documentation)
-- ============================================================

COMMENT ON TABLE bank_accounts IS 'Co-op bank accounts with API integration support (Mercury, Stripe)';
COMMENT ON COLUMN bank_accounts.external_provider IS 'API provider: mercury, stripe, or manual';
COMMENT ON COLUMN bank_accounts.external_account_id IS 'Provider account ID for API sync';

COMMENT ON TABLE transactions IS 'Financial transactions with deduplication support for API imports';
COMMENT ON COLUMN transactions.external_id IS 'Provider transaction ID - prevents duplicate imports';

COMMENT ON TABLE projects IS 'Co-op projects (1-2 people) and ventures (3+ people)';
COMMENT ON TABLE capital_accounts IS 'Member capital accounts (K-1 partnership equity tracking)';
COMMENT ON COLUMN capital_accounts.current_balance IS 'Auto-calculated: initial + labor + capital + patronage - draws';

COMMENT ON TABLE labor_contributions IS 'Member labor contributions with FMV tracking';
COMMENT ON COLUMN labor_contributions.fmv_total IS 'Auto-calculated: hours × hourly_rate';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify all tables exist
SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN 'RLS Enabled'
    ELSE 'RLS Disabled'
  END as security_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'bank_accounts', 'transactions', 'projects', 'project_participants',
    'project_milestones', 'capital_accounts', 'capital_transactions',
    'labor_contributions'
  )
ORDER BY tablename;

-- Verify indexes
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verify RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
