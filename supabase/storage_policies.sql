-- Enable Storage Extension if not already active (usually default in Supabase)
-- EXTENSIONS are usually handled by dashboard, but policies are SQL.

-- 1. Create the bucket (IDEMPOTENT)
INSERT INTO storage.buckets (id, name, public)
VALUES ('veiculos', 'veiculos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on objects (It is enabled by default, but good to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public View Access
-- Allows anyone to fetch the image (required for getPublicUrl to work without signed URLs)
CREATE POLICY "Public View Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'veiculos' );

-- 4. Policy: Authenticated Upload
-- Only logged-in users can upload files
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'veiculos' 
  AND auth.role() = 'authenticated'
);

-- 5. Policy: Owner Update/Delete
-- Users can only delete or update files they own
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'veiculos' 
  AND auth.uid() = owner
);

CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'veiculos' 
  AND auth.uid() = owner
);
