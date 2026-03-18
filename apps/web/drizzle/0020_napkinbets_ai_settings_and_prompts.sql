-- Add chat_model column to napkinbets_app_settings
ALTER TABLE `napkinbets_app_settings` ADD `chat_model` text NOT NULL DEFAULT 'grok-3-mini';

-- Create napkinbets_system_prompts table for admin-editable system prompts
CREATE TABLE `napkinbets_system_prompts` (
  `name` text PRIMARY KEY NOT NULL,
  `content` text NOT NULL,
  `description` text NOT NULL,
  `updated_at` text NOT NULL
);
