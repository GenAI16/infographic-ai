-- =====================================================
-- MIGRATION: Supabase Storage Setup for Infographics
-- =====================================================
-- 
-- IMPORTANT: Run this SQL in Supabase SQL Editor
-- 
-- Before running this SQL, you need to create the bucket manually:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: "infographics"
-- 4. Check "Public bucket" (for easy image access)
-- 5. Click "Create bucket"
--
-- Then run this SQL to set up the access policies:

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own infographics"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'infographics' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own infographics"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'infographics' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own infographics"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'infographics' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (since bucket is public)
CREATE POLICY "Public read access for infographics"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'infographics');
