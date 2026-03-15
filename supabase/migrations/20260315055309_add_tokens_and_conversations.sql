/*
  # Add Tokens and Conversations Management

  ## New Tables
  
  ### `github_tokens`
  - `id` (uuid, primary key)
  - `name` (text) - Friendly name like "Main Token", "Bolt Token #2"
  - `token` (text) - The actual token value (encrypted at rest)
  - `scopes` (text) - Token permissions/scopes
  - `created_at` (timestamptz)
  - `last_used_at` (timestamptz)
  
  ### `conversation_threads`
  - `id` (uuid, primary key)
  - `title` (text) - Auto-generated or user-defined title
  - `source` (text) - 'bolt', 'claude', 'search-ai', etc.
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `conversation_messages`
  - `id` (uuid, primary key)
  - `thread_id` (uuid, foreign key to conversation_threads)
  - `role` (text) - 'user', 'assistant', 'system'
  - `content` (text) - The actual message content
  - `created_at` (timestamptz)
  
  ### `conversation_summaries`
  - `id` (uuid, primary key)
  - `thread_id` (uuid, foreign key to conversation_threads)
  - `summary` (text) - AI-generated summary
  - `key_points` (jsonb) - Structured key points
  - `generated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Allow authenticated users full access (single user system)
  
  ## Indexes
  - Index on thread_id for faster message queries
  - Index on source for filtering conversations by origin
*/

-- GitHub Tokens Table
CREATE TABLE IF NOT EXISTS github_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token text NOT NULL,
  scopes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now()
);

ALTER TABLE github_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to github_tokens"
  ON github_tokens
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Conversation Threads Table
CREATE TABLE IF NOT EXISTS conversation_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to conversation_threads"
  ON conversation_threads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_conversation_threads_source ON conversation_threads(source);
CREATE INDEX IF NOT EXISTS idx_conversation_threads_updated_at ON conversation_threads(updated_at DESC);

-- Conversation Messages Table
CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to conversation_messages"
  ON conversation_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread_id ON conversation_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);

-- Conversation Summaries Table
CREATE TABLE IF NOT EXISTS conversation_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
  summary text NOT NULL,
  key_points jsonb DEFAULT '[]'::jsonb,
  generated_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to conversation_summaries"
  ON conversation_summaries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_conversation_summaries_thread_id ON conversation_summaries(thread_id);