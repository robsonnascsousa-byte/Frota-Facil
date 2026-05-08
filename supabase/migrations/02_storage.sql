-- Add foto_url column to veiculos table if it doesn't exist
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Create a storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('veiculos', 'veiculos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the storage bucket
-- Allow public read access to vehicle photos
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'veiculos' );

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'veiculos' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their photos
CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'veiculos' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete photos
CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'veiculos' AND auth.role() = 'authenticated' );
