/*
# AI Citizen OS — Core Schema

## Purpose
Creates the foundational database tables for a multilingual AI government companion app.
Citizens sign in with email/password; each citizen owns their profile, family members,
documents, applications, complaints, chat history, and notifications.

## New Tables
1. `profiles` — Citizen demographic profile (one row per auth user). Drives scheme eligibility matching.
2. `family_members` — Additional family members the citizen manages from the Family Dashboard.
3. `schemes` — Catalog of Central/State government welfare schemes, scholarships, pensions, etc. (reference data, shared).
4. `documents` — Citizen's identity documents and certificates with expiry/verification status.
5. `applications` — Citizen's applications to schemes, with status tracking and predicted approval probability.
6. `complaints` — Civic complaints (roads, water, streetlights, corruption, etc.) with department routing.
7. `notifications` — Personalized notifications to the citizen (deadlines, approvals, announcements).
8. `chat_messages` — Conversation history with the AI assistant (multilingual).
9. `offices` — Government service centres (Aadhaar, RTO, Passport Seva Kendra, CSC, etc.) (reference data, shared).

## Security (RLS)
- `profiles`: owner-scoped to the authenticated user via `auth.uid() = user_id`.
- `family_members`, `documents`, `applications`, `complaints`, `notifications`, `chat_messages`: owner-scoped to `auth.uid() = user_id`.
- `schemes` and `offices`: shared reference data readable by any authenticated user (SELECT only; writes blocked).
- Owner columns default to `auth.uid()` so inserts that omit `user_id` succeed.

## Notes
1. `schemes` stores structured eligibility criteria as JSONB so the AI matcher can evaluate age/income/occupation/category.
2. `applications` links to `schemes` via foreign key and stores a predicted approval probability + missing-doc hints.
3. `chat_messages` stores role (`user`/`assistant`) and language code for multilingual conversation continuity.
4. Timestamps use `timestamptz DEFAULT now()`.
*/

-- ============ profiles ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  date_of_birth date,
  gender text DEFAULT '',
  community_category text DEFAULT '',      -- General / OBC / SC / ST
  annual_income numeric DEFAULT 0,
  occupation text DEFAULT '',              -- student / farmer / employed / entrepreneur / homemaker / senior / unemployed
  education text DEFAULT '',               -- below-10th / 10th / 12th / graduate / postgraduate / research
  disability_status boolean NOT NULL DEFAULT false,
  state text DEFAULT 'Tamil Nadu',
  district text DEFAULT '',
  pincode text DEFAULT '',
  address text DEFAULT '',
  preferred_language text NOT NULL DEFAULT 'en',  -- en / hi / ta
  avatar_url text DEFAULT '',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ family_members ============
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  relationship text NOT NULL DEFAULT '',   -- spouse / child / parent / sibling / dependent
  date_of_birth date,
  gender text DEFAULT '',
  community_category text DEFAULT '',
  occupation text DEFAULT '',
  education text DEFAULT '',
  disability_status boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_family" ON family_members;
CREATE POLICY "select_own_family" ON family_members FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_family" ON family_members;
CREATE POLICY "insert_own_family" ON family_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_family" ON family_members;
CREATE POLICY "update_own_family" ON family_members FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_family" ON family_members;
CREATE POLICY "delete_own_family" ON family_members FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ schemes (shared reference data) ============
CREATE TABLE IF NOT EXISTS schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_hi text DEFAULT '',
  name_ta text DEFAULT '',
  description text NOT NULL DEFAULT '',
  description_hi text DEFAULT '',
  description_ta text DEFAULT '',
  category text NOT NULL DEFAULT '',       -- scholarship / pension / healthcare / housing / farmer / employment / business / subsidy / insurance / tax / women / disability / senior
  ministry text DEFAULT '',
  level text NOT NULL DEFAULT 'central',  -- central / state / local
  state text DEFAULT '',                   -- empty for central
  benefits text DEFAULT '',
  eligibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  documents_required text[] DEFAULT '{}',
  application_url text DEFAULT '',
  deadline text DEFAULT '',
  estimated_days integer DEFAULT 30,
  tags text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_schemes" ON schemes;
CREATE POLICY "read_schemes" ON schemes FOR SELECT
  TO authenticated USING (true);

-- ============ documents ============
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT '',           -- aadhaar / pan / voter / passport / driving / birth / income / community / residence / ration / ...
  title text NOT NULL DEFAULT '',
  number text DEFAULT '',                  -- masked number
  issue_date date,
  expiry_date date,
  status text NOT NULL DEFAULT 'verified', -- verified / pending / missing / expired
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ applications ============
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  scheme_id uuid REFERENCES schemes(id) ON DELETE SET NULL,
  scheme_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',    -- draft / submitted / under-review / approved / rejected / pending-docs
  predicted_approval integer DEFAULT 0,    -- 0-100 probability
  missing_documents text[] DEFAULT '{}',
  notes text DEFAULT '',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_applications" ON applications;
CREATE POLICY "select_own_applications" ON applications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_applications" ON applications;
CREATE POLICY "insert_own_applications" ON applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_applications" ON applications;
CREATE POLICY "update_own_applications" ON applications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_applications" ON applications;
CREATE POLICY "delete_own_applications" ON applications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ complaints ============
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT '',       -- road / streetlight / water / sanitation / electricity / corruption / other
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  location text DEFAULT '',
  latitude numeric,
  longitude numeric,
  department text DEFAULT '',              -- auto-routed
  status text NOT NULL DEFAULT 'submitted',-- submitted / routed / in-progress / resolved / rejected
  priority text NOT NULL DEFAULT 'normal', -- low / normal / high
  tracking_id text NOT NULL UNIQUE DEFAULT upper(substr(replace(md5(random()::text), '-', ''), 1, 10)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_complaints" ON complaints;
CREATE POLICY "select_own_complaints" ON complaints FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_complaints" ON complaints;
CREATE POLICY "insert_own_complaints" ON complaints FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_complaints" ON complaints;
CREATE POLICY "update_own_complaints" ON complaints FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_complaints" ON complaints;
CREATE POLICY "delete_own_complaints" ON complaints FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ notifications ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',       -- info / deadline / approval / document / announcement / scam-alert
  title text NOT NULL DEFAULT '',
  body text DEFAULT '',
  priority text NOT NULL DEFAULT 'normal', -- low / normal / high
  is_read boolean NOT NULL DEFAULT false,
  action_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ chat_messages ============
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',       -- user / assistant
  content text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chat" ON chat_messages;
CREATE POLICY "select_own_chat" ON chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chat" ON chat_messages;
CREATE POLICY "insert_own_chat" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_chat" ON chat_messages;
CREATE POLICY "update_own_chat" ON chat_messages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chat" ON chat_messages;
CREATE POLICY "delete_own_chat" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ offices (shared reference data) ============
CREATE TABLE IF NOT EXISTS offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',           -- aadhaar / passport / rto / taluk / collectorate / csc / bank / hospital / police / agriculture / employment / municipal
  address text DEFAULT '',
  district text DEFAULT '',
  state text DEFAULT '',
  latitude numeric,
  longitude numeric,
  services text[] DEFAULT '{}',
  timings text DEFAULT '',
  phone text DEFAULT '',
  estimated_wait_mins integer DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE offices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_offices" ON offices;
CREATE POLICY "read_offices" ON offices FOR SELECT
  TO authenticated USING (true);

-- ============ indexes ============
CREATE INDEX IF NOT EXISTS idx_schemes_category ON schemes(category);
CREATE INDEX IF NOT EXISTS idx_schemes_level ON schemes(level);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_tracking ON complaints(tracking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_family_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_offices_type ON offices(type);
CREATE INDEX IF NOT EXISTS idx_offices_district ON offices(district);

-- ============ updated_at trigger function ============
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated ON documents;
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_applications_updated ON applications;
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_complaints_updated ON complaints;
CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
