-- =============================================================================
-- Migration: 002_storage_setup.sql
-- Description: Supabase Storage Buckets for Mobile & Web file storage
-- Dedicated mobile bucket: mobile-receipts
-- Dedicated web bucket: web-receipts
-- =============================================================================

-- 1. Create dedicated mobile-receipts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('mobile-receipts', 'mobile-receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create dedicated web-receipts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('web-receipts', 'web-receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;
 
-- 3. Storage access policies for mobile-receipts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read on mobile-receipts'
  ) THEN
    CREATE POLICY "Allow public read on mobile-receipts"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'mobile-receipts');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on mobile-receipts'
  ) THEN
    CREATE POLICY "Allow public insert on mobile-receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'mobile-receipts');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update on mobile-receipts'
  ) THEN
    CREATE POLICY "Allow public update on mobile-receipts"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'mobile-receipts');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete on mobile-receipts'
  ) THEN
    CREATE POLICY "Allow public delete on mobile-receipts"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'mobile-receipts');
  END IF;
END $$;

-- 4. Add receipt_url column to transactions table for receipt attachments
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
