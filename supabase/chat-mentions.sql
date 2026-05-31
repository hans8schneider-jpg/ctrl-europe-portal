-- Migration: add user_target to notifications for @mention targeting
-- Run this in Supabase SQL editor before deploying the mention feature.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_target UUID REFERENCES profiles(id) ON DELETE CASCADE;
