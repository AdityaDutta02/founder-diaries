-- Add image style preference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image_style TEXT DEFAULT 'professional';

COMMENT ON COLUMN profiles.image_style IS 'User''s preferred image generation style: professional, sketch, or minimalist';
