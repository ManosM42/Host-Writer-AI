-- Create user_integrations table for storing platform credentials
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_username TEXT,
  connected_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own integrations
CREATE POLICY "Users can view their own integrations"
  ON user_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON user_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON user_integrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON user_integrations
  FOR DELETE
  USING (auth.uid() = user_id);
