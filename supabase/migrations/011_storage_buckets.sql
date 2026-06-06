-- 011: Storage buckets and policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('store-banners', 'store-banners', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('rider-documents', 'rider-documents', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('task-attachments', 'task-attachments', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "product_images_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "product_images_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "store_banners_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'store-banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "store_banners_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'store-banners');

CREATE POLICY "rider_docs_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'rider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "rider_docs_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'rider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "task_attachments_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "task_attachments_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);
