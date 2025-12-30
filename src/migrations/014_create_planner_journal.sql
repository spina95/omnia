-- Migration: Create Planner & Journal tables
-- Description: Tables for daily planning (tasks) and journaling with tag-based search

-- Create day_entries table (one entry per day per user)
CREATE TABLE IF NOT EXISTS day_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  mood VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Create day_tasks table (tasks for each day)
CREATE TABLE IF NOT EXISTS day_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_entry_id UUID NOT NULL REFERENCES day_entries(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('todo', 'done', 'postponed')),
  task_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create journal_entries table (one journal per day entry)
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_entry_id UUID NOT NULL REFERENCES day_entries(id) ON DELETE CASCADE,
  free_text TEXT,
  went_well TEXT,
  challenges TEXT,
  takeaway TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_entry_id)
);

-- Indexes for performance
CREATE INDEX idx_day_entries_user_id ON day_entries(user_id);
CREATE INDEX idx_day_entries_entry_date ON day_entries(entry_date DESC);
CREATE INDEX idx_day_entries_user_date ON day_entries(user_id, entry_date DESC);

CREATE INDEX idx_day_tasks_day_entry_id ON day_tasks(day_entry_id);
CREATE INDEX idx_day_tasks_status ON day_tasks(status);

CREATE INDEX idx_journal_entries_day_entry_id ON journal_entries(day_entry_id);
CREATE INDEX idx_journal_entries_tags ON journal_entries USING GIN(tags);

-- Full-text search index on journal text fields
CREATE INDEX idx_journal_entries_free_text_search ON journal_entries USING GIN(to_tsvector('english', COALESCE(free_text, '')));

-- Row Level Security Policies

-- day_entries policies
ALTER TABLE day_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own day entries" ON day_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own day entries" ON day_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own day entries" ON day_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own day entries" ON day_entries
  FOR DELETE USING (auth.uid() = user_id);

-- day_tasks policies
ALTER TABLE day_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks of their own day entries" ON day_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM day_entries
      WHERE day_entries.id = day_tasks.day_entry_id
      AND day_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks for their own day entries" ON day_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM day_entries
      WHERE day_entries.id = day_tasks.day_entry_id
      AND day_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks of their own day entries" ON day_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM day_entries
      WHERE day_entries.id = day_tasks.day_entry_id
      AND day_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks of their own day entries" ON day_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM day_entries
      WHERE day_entries.id = day_tasks.day_entry_id
      AND day_entries.user_id = auth.uid()
    )
  );

-- journal_entries policies
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view journals of their own day entries" ON journal_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM day_entries
      WHERE day_entries.id = journal_entries.day_entry_id
      AND day_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert journals for their own day entries" ON journal_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM day_entries
      WHERE day_entries.id = journal_entries.day_entry_id
      AND day_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update journals of their own day entries" ON journal_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM day_entries
      WHERE day_entries.id = journal_entries.day_entry_id
      AND day_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete journals of their own day entries" ON journal_entries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM day_entries
      WHERE day_entries.id = journal_entries.day_entry_id
      AND day_entries.user_id = auth.uid()
    )
  );

-- Triggers for updated_at columns

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_day_entries_updated_at
  BEFORE UPDATE ON day_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_day_tasks_updated_at
  BEFORE UPDATE ON day_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
