-- Migration: Create todo lists and tasks tables
-- Description: Adds support for todo lists with tasks, priorities, and due dates

-- Create todo_lists table
CREATE TABLE IF NOT EXISTS todo_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for todo_lists
CREATE INDEX idx_todo_lists_user_id ON todo_lists(user_id);
CREATE INDEX idx_todo_lists_due_date ON todo_lists(due_date);
CREATE INDEX idx_todo_lists_priority ON todo_lists(priority);
CREATE INDEX idx_todo_lists_created_at ON todo_lists(created_at DESC);

-- Create todo_tasks table
CREATE TABLE IF NOT EXISTS todo_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for todo_tasks
CREATE INDEX idx_todo_tasks_list_id ON todo_tasks(list_id);
CREATE INDEX idx_todo_tasks_completed ON todo_tasks(completed);
CREATE INDEX idx_todo_tasks_order_index ON todo_tasks(list_id, order_index);

-- Enable Row Level Security for todo_lists
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for todo_lists
CREATE POLICY "Users can view their own todo lists" ON todo_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todo lists" ON todo_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todo lists" ON todo_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todo lists" ON todo_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Enable Row Level Security for todo_tasks
ALTER TABLE todo_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for todo_tasks (based on list ownership)
CREATE POLICY "Users can view tasks of their own lists" ON todo_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM todo_lists
      WHERE todo_lists.id = todo_tasks.list_id
      AND todo_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks to their own lists" ON todo_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM todo_lists
      WHERE todo_lists.id = todo_tasks.list_id
      AND todo_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks of their own lists" ON todo_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM todo_lists
      WHERE todo_lists.id = todo_tasks.list_id
      AND todo_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks of their own lists" ON todo_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM todo_lists
      WHERE todo_lists.id = todo_tasks.list_id
      AND todo_lists.user_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_todo_lists_updated_at
  BEFORE UPDATE ON todo_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_tasks_updated_at
  BEFORE UPDATE ON todo_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
