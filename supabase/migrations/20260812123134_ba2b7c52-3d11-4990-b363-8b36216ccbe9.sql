CREATE POLICY "blog_public_read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'blog');

CREATE POLICY "blog_staff_write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blog' AND public.is_staff(auth.uid()));

CREATE POLICY "blog_staff_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'blog' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'blog' AND public.is_staff(auth.uid()));

CREATE POLICY "blog_staff_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'blog' AND public.is_staff(auth.uid()));

CREATE POLICY "att_guest_insert" ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = 'guest');