
CREATE POLICY "att_user_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "att_user_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachments' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));

CREATE POLICY "att_staff_all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'attachments' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'attachments' AND public.is_staff(auth.uid()));
