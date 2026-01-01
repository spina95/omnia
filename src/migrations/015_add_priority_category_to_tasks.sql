-- Migration: Add priority and category to todo tasks
-- Description: Adds priority (low, medium, high) and category (optional, task, idea) fields to todo_tasks table

-- Add priority column
ALTER TABLE todo_tasks 
ADD COLUMN priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high'));

-- Add category column
ALTER TABLE todo_tasks 
ADD COLUMN category VARCHAR(20) CHECK (category IN ('optional', 'task', 'idea')) DEFAULT 'task';

-- Create indexes for filtering
CREATE INDEX idx_todo_tasks_priority ON todo_tasks(priority);
CREATE INDEX idx_todo_tasks_category ON todo_tasks(category);

-- Set default value for existing rows
UPDATE todo_tasks SET category = 'task' WHERE category IS NULL;
