INSERT INTO storage.buckets (id, name, public) VALUES ('diary-audio', 'diary-audio', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('diary-images', 'diary-images', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Users upload own audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'diary-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own audio" ON storage.objects FOR SELECT USING (bucket_id = 'diary-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own audio" ON storage.objects FOR DELETE USING (bucket_id = 'diary-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'diary-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own images" ON storage.objects FOR SELECT USING (bucket_id = 'diary-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own images" ON storage.objects FOR DELETE USING (bucket_id = 'diary-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own generated images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own generated images" ON storage.objects FOR SELECT USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public avatar read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
