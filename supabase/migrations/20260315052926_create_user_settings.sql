/*
  # User Settings Table

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique) - setting key like 'github_username', 'git_remote_url'
      - `value` (text) - setting value
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `user_settings` table
    - Allow all access for now (single user system)
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to user_settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);