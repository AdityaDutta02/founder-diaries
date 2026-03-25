ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own profile" ON profiles FOR ALL USING (id = auth.uid());

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own diary entries" ON diary_entries FOR ALL USING (user_id = auth.uid());

ALTER TABLE diary_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own diary images" ON diary_images FOR ALL USING (user_id = auth.uid());

ALTER TABLE platform_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own platform configs" ON platform_configs FOR ALL USING (user_id = auth.uid());

ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own creator profiles" ON creator_profiles FOR ALL USING (user_id = auth.uid());

ALTER TABLE creator_content_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own content samples" ON creator_content_samples FOR ALL USING (
  creator_profile_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid())
);

ALTER TABLE content_writing_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own writing profiles" ON content_writing_profiles FOR ALL USING (user_id = auth.uid());

ALTER TABLE generated_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own generated posts" ON generated_posts FOR ALL USING (user_id = auth.uid());

ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own generation queue" ON generation_queue FOR ALL USING (user_id = auth.uid());

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own activity log" ON user_activity_log FOR ALL USING (user_id = auth.uid());
