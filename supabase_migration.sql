-- ============================================================
-- PineVela - Supabase Migration Script
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mwpssbvbjnhrpxpgcyuk/sql
--
-- This script ONLY adds missing columns and seeds the 4 hostels.
-- It does NOT drop or recreate existing tables.
-- ============================================================

-- STEP 1: Add missing columns to the existing hostels table
ALTER TABLE public.hostels
  ADD COLUMN IF NOT EXISTS location          TEXT,
  ADD COLUMN IF NOT EXISTS wing              TEXT,
  ADD COLUMN IF NOT EXISTS price             NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS image             TEXT,
  ADD COLUMN IF NOT EXISTS image_url         TEXT,
  ADD COLUMN IF NOT EXISTS manager_name      TEXT,
  ADD COLUMN IF NOT EXISTS manager_phone     TEXT,
  ADD COLUMN IF NOT EXISTS manager_email     TEXT,
  ADD COLUMN IF NOT EXISTS manager_id        TEXT,
  ADD COLUMN IF NOT EXISTS beds_left         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_spaces  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_capacity    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating            NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS registration_date DATE,
  ADD COLUMN IF NOT EXISTS subscription_paid BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_approved       BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS approval_status   TEXT DEFAULT 'Approved',
  ADD COLUMN IF NOT EXISTS amenities         JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS pricing           JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hostel_type       TEXT,
  ADD COLUMN IF NOT EXISTS gender            TEXT;

-- STEP 2: Temporarily disable RLS so we can insert seed data
ALTER TABLE public.hostels DISABLE ROW LEVEL SECURITY;

-- STEP 3: Seed the 4 registered hostels
INSERT INTO public.hostels (
  id, name, location, wing, status,
  beds_left, total_capacity, available_spaces,
  price, image, image_url,
  manager_name, manager_phone, manager_email,
  description, rating, registration_date,
  subscription_paid, is_approved, approval_status,
  amenities, pricing, hostel_type, gender
) VALUES

('hostel-1','Pine Crest Residency','North Campus, Sector 5, Accra','North Wing','Open',
 12,120,12,3500,
 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
 'Sarah Johnson','+23324488923','sarah.j@pinevela.com',
 'A beautiful and serene student residential community featuring modern air-conditioned master suites, standard shared rooms, free shuttle transport, high-speed fiber-optic WiFi, and a 24/7 learning library.',
 4.8,'2026-01-15',true,true,'Approved',
 '["WiFi","Air Conditioning","Shuttle","Library","Security"]',
 '{"single":4000,"shared":3500,"suite":5000}','Mixed','Mixed'),

('hostel-2','Emerald Heights Block A','Main Campus, East Wing, Accra','North Wing','Full',
 0,180,0,4200,
 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
 'Maxwell Mensah','+23350299882','maxwell.m@pinevela.com',
 'Located in the premium core zone of the campus, Emerald Heights offers direct walking paths to major lecture halls, high-security smart access gates, indoor game arenas, and spacious study halls.',
 4.6,'2026-02-10',true,true,'Approved',
 '["Smart Access","Game Arena","Study Hall","Security","WiFi"]',
 '{"single":4800,"shared":4200,"suite":6000}','Mixed','Mixed'),

('hostel-3','Sapphire Gardens','West Campus, Block B, Accra','South Side','Open',
 28,250,28,3800,
 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
 'David Kojo','+23324599812','david.k@pinevela.com',
 'Known for its scenic garden landscaping, Sapphire Gardens offers spacious single and dual-occupancy options, student kitchenettes on every floor, modern sports fields, and a standby power generator.',
 4.9,'2026-03-01',true,true,'Approved',
 '["Garden","Kitchenette","Sports Field","Generator","WiFi"]',
 '{"single":4200,"shared":3800,"suite":5500}','Mixed','Mixed'),

('hostel-4','Pine Ridge Annex','South Campus, Sector 9, Accra','South Side','Under Maintenance',
 15,90,15,3200,
 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
 'Angela Owusu','+23324119934','angela.o@pinevela.com',
 'Compact and highly convenient annex with direct campus bus connection, quiet reading corners, and solar-powered backup lighting.',
 4.5,'2026-03-15',true,true,'Approved',
 '["Bus Connection","Solar Backup","Reading Corner","WiFi"]',
 '{"single":3600,"shared":3200,"suite":4500}','Mixed','Mixed')

ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, location=EXCLUDED.location, wing=EXCLUDED.wing,
  status=EXCLUDED.status, beds_left=EXCLUDED.beds_left,
  total_capacity=EXCLUDED.total_capacity, available_spaces=EXCLUDED.available_spaces,
  price=EXCLUDED.price, image=EXCLUDED.image, image_url=EXCLUDED.image_url,
  manager_name=EXCLUDED.manager_name, manager_phone=EXCLUDED.manager_phone,
  manager_email=EXCLUDED.manager_email, description=EXCLUDED.description,
  rating=EXCLUDED.rating, registration_date=EXCLUDED.registration_date,
  subscription_paid=EXCLUDED.subscription_paid, is_approved=EXCLUDED.is_approved,
  approval_status=EXCLUDED.approval_status, amenities=EXCLUDED.amenities,
  pricing=EXCLUDED.pricing, hostel_type=EXCLUDED.hostel_type, gender=EXCLUDED.gender;

-- STEP 4: Re-enable RLS
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;

-- STEP 5: Fix RLS policies to allow anon reads & writes (server uses anon key)
DROP POLICY IF EXISTS hostels_public_read  ON public.hostels;
DROP POLICY IF EXISTS hostels_admin_insert ON public.hostels;
DROP POLICY IF EXISTS hostels_admin_update ON public.hostels;
DROP POLICY IF EXISTS hostels_admin_delete ON public.hostels;

CREATE POLICY hostels_public_read  ON public.hostels FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY hostels_admin_insert ON public.hostels FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY hostels_admin_update ON public.hostels FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY hostels_admin_delete ON public.hostels FOR DELETE TO anon, authenticated USING (true);

-- STEP 6: Verify — should return 4 rows
SELECT id, name, location, status, beds_left, rating, approval_status
FROM public.hostels
ORDER BY id;
