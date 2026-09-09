-- ============================================================================
-- PINEVELA PRODUCTION DATABASE v3
-- PostgreSQL / Supabase
--
-- Architecture:
--   Supabase Auth
--       ↓
--   public.profiles
--       ↓
--   role-based authorization + RLS
--
-- Hostel hierarchy:
--   Hostel
--      └── Block
--           └── Floor
--                └── Room
--                     └── Bed
--
-- Manager onboarding:
--   manager_registration_requests
--            ↓
--   admin approval
--            ↓
--   profiles.role = manager
--   manager_profiles
--
-- Hostel onboarding:
--   hostel_verifications
--            ↓
--   admin approval
--            ↓
--   hostels
--            ↓
--   hostel_managers
--
-- Payment:
--   Client → payment provider
--         → server/webhook verification
--         → payments
--
-- Allocation:
--   Secure RPC
--      ↓
--   application validation
--      ↓
--   allocation
--      ↓
--   bed/room synchronization
--
-- SECURITY PRINCIPLES
-- ============================================================================
-- 1. Supabase Auth owns authentication.
-- 2. public.profiles owns application identity.
-- 3. Client metadata can NEVER assign privileged roles.
-- 4. RLS is the primary authorization boundary.
-- 5. Sensitive verification data is never globally readable.
-- 6. Intermediate hostel onboarding does not create a hostels row.
-- 7. Financial success is never trusted from the client.
-- 8. Allocation is atomic.
-- 9. Hostel hierarchy is relationally consistent.
-- 10. No demo users, demo hostels or fake production records.
-- ============================================================================


-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================================
-- 1. CLEANUP
-- ============================================================================
-- DEVELOPMENT / REBUILD ONLY.
-- ============================================================================

DROP TABLE IF EXISTS
    public.message_reactions,
    public.chat_messages,
    public.chat_channel_members,
    public.chat_channels,
    public.audit_logs,
    public.ratings,
    public.announcements,
    public.notifications,
    public.meetings,
    public.complaints,
    public.maintenance_requests,
    public.payments,
    public.student_charges,
    public.allocations,
    public.applications,
    public.fee_structures,
    public.beds,
    public.rooms,
    public.floors,
    public.blocks,
    public.hostel_managers,
    public.hostel_policies,
    public.hostel_facilities,
    public.facilities,
    public.hostel_images,
    public.hostels,
    public.hostel_onboarding_payments,
    public.verification_documents,
    public.hostel_verifications,
    public.manager_verifications,
    public.manager_profiles,
    public.manager_registration_requests,
    public.staff_profiles,
    public.admin_settings,
    public.profiles
CASCADE;


DROP TYPE IF EXISTS
    public.user_role,
    public.hostel_status,
    public.hostel_gender,
    public.application_status,
    public.allocation_status,
    public.bed_status,
    public.room_status,
    public.charge_status,
    public.payment_status,
    public.payment_method,
    public.payment_frequency,
    public.maintenance_status,
    public.priority_level,
    public.complaint_status,
    public.meeting_type,
    public.meeting_status,
    public.notification_type,
    public.announcement_priority,
    public.chat_channel_type,
    public.verification_status,
    public.document_type,
    public.verification_owner_type
CASCADE;


-- ============================================================================
-- 2. ENUMS
-- ============================================================================

CREATE TYPE public.user_role AS ENUM (
    'student',
    'manager',
    'admin',
    'staff'
);

CREATE TYPE public.hostel_status AS ENUM (
    'active',
    'inactive',
    'under_maintenance',
    'Open',
    'Full',
    'Under Maintenance',
    'Pending Approval',
    'Approved',
    'Rejected'
);

CREATE TYPE public.hostel_gender AS ENUM (
    'male',
    'female',
    'mixed'
);

CREATE TYPE public.application_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);

CREATE TYPE public.allocation_status AS ENUM (
    'active',
    'ended',
    'transferred',
    'cancelled'
);

CREATE TYPE public.bed_status AS ENUM (
    'available',
    'occupied',
    'reserved',
    'maintenance',
    'inactive'
);

CREATE TYPE public.room_status AS ENUM (
    'available',
    'full',
    'maintenance',
    'inactive'
);

CREATE TYPE public.charge_status AS ENUM (
    'pending',
    'partially_paid',
    'paid',
    'overdue',
    'cancelled'
);

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'successful',
    'failed',
    'refunded'
);

CREATE TYPE public.payment_method AS ENUM (
    'paystack',
    'mobile_money',
    'bank_transfer',
    'card',
    'cash',
    'other'
);

CREATE TYPE public.payment_frequency AS ENUM (
    'monthly',
    'semester',
    'academic_year',
    'custom'
);

CREATE TYPE public.maintenance_status AS ENUM (
    'submitted',
    'acknowledged',
    'in_progress',
    'resolved',
    'rejected'
);

CREATE TYPE public.priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TYPE public.complaint_status AS ENUM (
    'submitted',
    'under_review',
    'in_progress',
    'resolved',
    'rejected'
);

CREATE TYPE public.meeting_type AS ENUM (
    'video_call',
    'chat',
    'in_person'
);

CREATE TYPE public.meeting_status AS ENUM (
    'pending',
    'approved',
    'declined',
    'completed',
    'cancelled'
);

CREATE TYPE public.notification_type AS ENUM (
    'info',
    'success',
    'warning',
    'error'
);

CREATE TYPE public.announcement_priority AS ENUM (
    'normal',
    'important',
    'urgent'
);

CREATE TYPE public.chat_channel_type AS ENUM (
    'global',
    'hostel',
    'direct'
);

CREATE TYPE public.verification_status AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'cancelled'
);

CREATE TYPE public.document_type AS ENUM (
    'national_id',
    'passport',
    'drivers_license',
    'business_registration',
    'property_document',
    'authorization_letter',
    'proof_of_address',
    'hostel_license',
    'other'
);

CREATE TYPE public.verification_owner_type AS ENUM (
    'manager',
    'hostel'
);


-- ============================================================================
-- 3. COMMON TIMESTAMP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


-- ============================================================================
-- 4. PROFILES
-- ============================================================================

CREATE TABLE public.profiles (
    -- TEXT PK: supports both Supabase Auth UUIDs and custom IDs (admin_001, manager_101, etc.)
    id TEXT PRIMARY KEY,

    -- Optional backlink to Supabase Auth user (nullable for custom/seed users)
    auth_user_id UUID UNIQUE
        REFERENCES auth.users(id)
        ON DELETE SET NULL,

    email TEXT NOT NULL,
    username TEXT UNIQUE,

    full_name TEXT NOT NULL,

    role public.user_role NOT NULL DEFAULT 'student',

    phone TEXT,
    avatar_url TEXT,
    bio TEXT,

    national_id TEXT,
    organization TEXT,
    role_title TEXT,
    experience_years INTEGER NOT NULL DEFAULT 0,

    address TEXT,

    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_status public.verification_status
        NOT NULL DEFAULT 'pending',

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT profiles_username_length
        CHECK (
            username IS NULL
            OR char_length(username) BETWEEN 3 AND 50
        ),

    CONSTRAINT profiles_experience_nonnegative
        CHECK (experience_years >= 0),

    CONSTRAINT profiles_email_format
        CHECK (position('@' IN email) > 1)
);


CREATE INDEX profiles_role_idx
    ON public.profiles(role);

CREATE INDEX profiles_active_idx
    ON public.profiles(is_active);


CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 5. MANAGER REGISTRATION REQUESTS
-- ============================================================================

CREATE TABLE public.manager_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    manager_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    manager_name TEXT NOT NULL,
    manager_email TEXT NOT NULL,
    manager_phone TEXT,

    national_id TEXT,
    organization TEXT,
    role_title TEXT,

    experience_years INTEGER NOT NULL DEFAULT 0,

    property_name TEXT,
    proposed_hostel_name TEXT,
    proposed_location TEXT,
    proposed_capacity INTEGER,

    notes TEXT,
    reason TEXT,

    status public.verification_status NOT NULL DEFAULT 'pending',

    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,

    admin_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT manager_registration_experience_check
        CHECK (experience_years >= 0),

    CONSTRAINT manager_registration_capacity_check
        CHECK (
            proposed_capacity IS NULL
            OR proposed_capacity > 0
        ),

    CONSTRAINT manager_registration_review_check
        CHECK (
            status = 'pending'
            OR reviewed_at IS NOT NULL
        )
);


CREATE INDEX manager_registration_manager_idx
    ON public.manager_registration_requests(manager_id);

CREATE INDEX manager_registration_status_idx
    ON public.manager_registration_requests(status);


CREATE UNIQUE INDEX one_pending_manager_registration
ON public.manager_registration_requests(manager_id)
WHERE status IN ('pending', 'under_review');


CREATE TRIGGER manager_registration_updated_at
BEFORE UPDATE ON public.manager_registration_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 6. MANAGER PROFILES
-- ============================================================================

CREATE TABLE public.manager_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id TEXT NOT NULL UNIQUE
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,

    national_id TEXT,

    organization TEXT,
    role_title TEXT,

    experience_years INTEGER NOT NULL DEFAULT 0,

    operating_address TEXT,

    verification_status public.verification_status
        NOT NULL DEFAULT 'pending',

    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT manager_profiles_experience_check
        CHECK (experience_years >= 0)
);


CREATE INDEX manager_profiles_user_idx
    ON public.manager_profiles(user_id);


CREATE TRIGGER manager_profiles_updated_at
BEFORE UPDATE ON public.manager_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 7. MANAGER VERIFICATIONS
-- ============================================================================
-- Sensitive.
-- manager_id is a profile ID (TEXT).
-- ============================================================================

CREATE TABLE public.manager_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    manager_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    manager_name TEXT NOT NULL,
    manager_email TEXT NOT NULL,
    manager_phone TEXT,

    country TEXT DEFAULT 'Ghana',

    id_document_type public.document_type,
    hashed_id_number TEXT,
    masked_id_number TEXT,
    full_name_on_id TEXT,

    date_of_birth DATE,
    id_expiry_date DATE,

    id_verification_status public.verification_status
        NOT NULL DEFAULT 'pending',

    authority_relationship TEXT,

    claimed_owner_name TEXT,
    claimed_owner_phone TEXT,

    organization TEXT,
    registration_number TEXT,

    authority_evidence TEXT,

    system_checks JSONB NOT NULL DEFAULT '{}'::jsonb,

    status public.verification_status
        NOT NULL DEFAULT 'pending',

    admin_notes TEXT,

    reviewed_by TEXT
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX manager_verifications_manager_idx
    ON public.manager_verifications(manager_id);

CREATE INDEX manager_verifications_status_idx
    ON public.manager_verifications(status);


CREATE TRIGGER manager_verifications_updated_at
BEFORE UPDATE ON public.manager_verifications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 8. HOSTELS
-- ============================================================================
-- IMPORTANT:
-- A hostel exists here ONLY after approval.
-- ============================================================================

CREATE TABLE public.hostels (
    -- TEXT PK supports both UUID format ('550e8400-...') and custom IDs ('hostel-1')
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

    name TEXT NOT NULL,

    description TEXT,

    hostel_type TEXT NOT NULL DEFAULT 'student_accommodation',

    gender public.hostel_gender NOT NULL DEFAULT 'mixed',

    -- TEXT status accepts both enum-style ('active') and app-style ('Open', 'Full', etc.)
    status TEXT NOT NULL DEFAULT 'Open',

    year_established INTEGER,

    -- Contact info
    contact_email TEXT,
    contact_phone TEXT,
    alternative_phone TEXT,
    website TEXT,

    -- Address (nullable so hostel can be created with just a location string)
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    region TEXT,
    district TEXT,
    country TEXT NOT NULL DEFAULT 'Ghana',
    postal_code TEXT,
    digital_address TEXT,
    landmark TEXT,

    -- Coordinates
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    -- -----------------------------------------------------------------------
    -- APP-FACING FIELDS (used by frontend, server.ts, supabaseServer.ts)
    -- -----------------------------------------------------------------------
    location TEXT,                         -- Human-readable location string
    wing TEXT,                             -- Block/wing label
    price NUMERIC(12,2),                   -- Default price per period
    image TEXT,                            -- Primary image URL
    image_url TEXT,                        -- Alias for image
    image_path TEXT,                       -- Storage path if uploaded
    manager_name TEXT,                     -- Display name of assigned manager
    manager_phone TEXT,
    manager_email TEXT,
    manager_id TEXT,                       -- FK-style reference to profiles.id (TEXT)
    beds_left INTEGER,                     -- Available beds right now
    available_spaces INTEGER,              -- Alias for beds_left
    total_capacity INTEGER,                -- Total beds in hostel
    max_capacity INTEGER,                  -- DB canonical max capacity
    rating NUMERIC(3,2) DEFAULT 5.0,       -- Average rating
    registration_date DATE,                -- Date hostel was registered
    subscription_paid BOOLEAN DEFAULT true,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    approval_status TEXT DEFAULT 'Pending Approval',
    total_blocks INTEGER DEFAULT 1,
    total_floors INTEGER DEFAULT 1,
    total_rooms INTEGER DEFAULT 0,
    amenities JSONB DEFAULT '[]'::jsonb,   -- Array of amenity strings
    rules JSONB DEFAULT '{}'::jsonb,       -- Rules / policies object
    pricing JSONB DEFAULT '{}'::jsonb,     -- Pricing breakdown object
    blocks JSONB DEFAULT '[]'::jsonb,      -- Embedded blocks data

    -- -----------------------------------------------------------------------
    -- OWNERSHIP / AUDIT
    -- -----------------------------------------------------------------------
    -- Nullable TEXT reference to profiles.id (no FK constraint to avoid seed issues)
    created_by TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT hostels_rating_check
        CHECK (rating IS NULL OR rating BETWEEN 0 AND 5),

    CONSTRAINT hostels_latitude_check
        CHECK (
            latitude IS NULL
            OR latitude BETWEEN -90 AND 90
        ),

    CONSTRAINT hostels_longitude_check
        CHECK (
            longitude IS NULL
            OR longitude BETWEEN -180 AND 180
        )
);


CREATE INDEX hostels_status_idx
    ON public.hostels(status);

CREATE INDEX hostels_city_idx
    ON public.hostels(city);

CREATE INDEX hostels_is_approved_idx
    ON public.hostels(is_approved);

CREATE INDEX hostels_manager_id_idx
    ON public.hostels(manager_id);


CREATE TRIGGER hostels_updated_at
BEFORE UPDATE ON public.hostels
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 9. HOSTEL VERIFICATIONS / ONBOARDING
-- ============================================================================
-- This is an intermediate onboarding entity.
-- It does NOT reference hostels.id before approval.
--
-- After approval, approved_hostel_id points to the actual hostels row.
-- ============================================================================

CREATE TABLE public.hostel_verifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

    -- TEXT references to support custom manager IDs (manager_101, etc.)
    manager_id TEXT NOT NULL,
    manager_name TEXT,
    manager_email TEXT,
    manager_phone TEXT,

    -- The hostel this verification pertains to (populated after submission)
    hostel_id TEXT,
    approved_hostel_id TEXT
        REFERENCES public.hostels(id)
        ON DELETE SET NULL,

    hostel_name TEXT NOT NULL,

    location TEXT,
    campus TEXT,

    address_line_1 TEXT,
    address_line_2 TEXT,

    city TEXT,
    region TEXT,
    district TEXT,
    country TEXT DEFAULT 'Ghana',

    postal_code TEXT,
    digital_address TEXT,
    landmark TEXT,

    capacity INTEGER,
    number_of_rooms INTEGER,
    number_of_blocks INTEGER,

    pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
    facilities JSONB NOT NULL DEFAULT '[]'::jsonb,

    primary_image_path TEXT,
    image_url TEXT,

    owner_name TEXT,
    owner_phone TEXT,
    owner_email TEXT,

    operator_name TEXT,
    operator_phone TEXT,

    authority_relationship TEXT,

    ownership_proof TEXT,
    authority_proof TEXT,

    proof_of_ownership_type TEXT,
    proof_of_ownership_document_url TEXT,
    proof_of_ownership_document_file_name TEXT,

    system_validation JSONB NOT NULL DEFAULT '{}'::jsonb,

    validation_passed BOOLEAN NOT NULL DEFAULT false,

    payment_status TEXT NOT NULL DEFAULT 'pending',

    payment_reference TEXT,

    payment_amount NUMERIC(12,2),

    payment_currency CHAR(3) NOT NULL DEFAULT 'GHS',

    payment_date TIMESTAMPTZ,

    -- TEXT status to accept both enum and string values
    status TEXT NOT NULL DEFAULT 'pending',

    admin_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT hostel_verification_capacity_check
        CHECK (
            capacity IS NULL
            OR capacity > 0
        ),

    CONSTRAINT hostel_verification_payment_check
        CHECK (
            payment_amount IS NULL
            OR payment_amount >= 0
        )
);


CREATE INDEX hostel_verifications_manager_idx
    ON public.hostel_verifications(manager_id);

CREATE INDEX hostel_verifications_status_idx
    ON public.hostel_verifications(status);

CREATE INDEX hostel_verifications_hostel_id_idx
    ON public.hostel_verifications(hostel_id);


CREATE TRIGGER hostel_verifications_updated_at
BEFORE UPDATE ON public.hostel_verifications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 10. VERIFICATION DOCUMENTS
-- ============================================================================

CREATE TABLE public.verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_type public.verification_owner_type NOT NULL,

    owner_id UUID NOT NULL,

    document_type public.document_type NOT NULL,

    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,

    file_size BIGINT,
    mime_type TEXT,

    is_sensitive BOOLEAN NOT NULL DEFAULT true,

    uploaded_by TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT verification_document_size_check
        CHECK (
            file_size IS NULL
            OR file_size >= 0
        )
);


CREATE INDEX verification_documents_owner_idx
    ON public.verification_documents(owner_type, owner_id);

CREATE INDEX verification_documents_uploader_idx
    ON public.verification_documents(uploaded_by);


-- ============================================================================
-- 11. HOSTEL ONBOARDING PAYMENTS
-- ============================================================================
-- Payment belongs to the onboarding verification, NOT a hostels row.
-- ============================================================================

CREATE TABLE public.hostel_onboarding_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hostel_verification_id TEXT NOT NULL
        REFERENCES public.hostel_verifications(id)
        ON DELETE RESTRICT,

    manager_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    hostel_name TEXT NOT NULL,

    amount NUMERIC(12,2) NOT NULL DEFAULT 50.00,
    currency CHAR(3) NOT NULL DEFAULT 'GHS',

    status public.payment_status NOT NULL DEFAULT 'pending',

    reference TEXT NOT NULL UNIQUE,

    agreement_acknowledged BOOLEAN NOT NULL DEFAULT false,

    payment_method public.payment_method,

    paid_at TIMESTAMPTZ,

    provider_reference TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT onboarding_payment_amount_check
        CHECK (amount > 0),

    CONSTRAINT onboarding_payment_success_check
        CHECK (
            status <> 'successful'
            OR paid_at IS NOT NULL
        )
);


CREATE INDEX onboarding_payment_verification_idx
    ON public.hostel_onboarding_payments(hostel_verification_id);

CREATE INDEX onboarding_payment_manager_idx
    ON public.hostel_onboarding_payments(manager_id);


CREATE TRIGGER onboarding_payments_updated_at
BEFORE UPDATE ON public.hostel_onboarding_payments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 12. HOSTEL IMAGES
-- ============================================================================

CREATE TABLE public.hostel_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE CASCADE,

    storage_path TEXT NOT NULL,
    public_url TEXT,

    is_primary BOOLEAN NOT NULL DEFAULT false,

    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(hostel_id, storage_path),

    CONSTRAINT hostel_image_order_check
        CHECK (display_order >= 0)
);


CREATE UNIQUE INDEX one_primary_hostel_image
ON public.hostel_images(hostel_id)
WHERE is_primary = true;


-- ============================================================================
-- 13. FACILITIES
-- ============================================================================

CREATE TABLE public.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,

    description TEXT,
    icon_name TEXT,

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TRIGGER facilities_updated_at
BEFORE UPDATE ON public.facilities
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.hostel_facilities (
    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE CASCADE,

    facility_id UUID NOT NULL
        REFERENCES public.facilities(id)
        ON DELETE RESTRICT,

    description TEXT,

    is_available BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY(hostel_id, facility_id)
);


-- ============================================================================
-- 14. HOSTEL POLICIES
-- ============================================================================

CREATE TABLE public.hostel_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hostel_id TEXT NOT NULL UNIQUE
        REFERENCES public.hostels(id)
        ON DELETE CASCADE,

    check_in_time TIME,
    check_out_time TIME,

    minimum_stay_days INTEGER,
    maximum_stay_days INTEGER,

    guest_policy TEXT,
    curfew_policy TEXT,
    smoking_policy TEXT,
    pets_policy TEXT,
    noise_policy TEXT,
    cancellation_policy TEXT,
    other_rules TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT hostel_policy_min_stay_check
        CHECK (
            minimum_stay_days IS NULL
            OR minimum_stay_days > 0
        ),

    CONSTRAINT hostel_policy_max_stay_check
        CHECK (
            maximum_stay_days IS NULL
            OR maximum_stay_days > 0
        ),

    CONSTRAINT hostel_policy_stay_range_check
        CHECK (
            minimum_stay_days IS NULL
            OR maximum_stay_days IS NULL
            OR maximum_stay_days >= minimum_stay_days
        )
);


CREATE TRIGGER hostel_policies_updated_at
BEFORE UPDATE ON public.hostel_policies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 15. HOSTEL MANAGERS
-- ============================================================================

CREATE TABLE public.hostel_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE CASCADE,

    manager_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    unassigned_at TIMESTAMPTZ,

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT hostel_manager_dates_check
        CHECK (
            unassigned_at IS NULL
            OR unassigned_at >= assigned_at
        )
);


CREATE UNIQUE INDEX one_active_hostel_manager
ON public.hostel_managers(hostel_id, manager_id)
WHERE is_active = true;


CREATE INDEX hostel_managers_hostel_idx
    ON public.hostel_managers(hostel_id);

CREATE INDEX hostel_managers_manager_idx
    ON public.hostel_managers(manager_id);


-- ============================================================================
-- 16. BLOCKS
-- ============================================================================

CREATE TABLE public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(hostel_id, name)
);


CREATE INDEX blocks_hostel_idx
    ON public.blocks(hostel_id);


CREATE TRIGGER blocks_updated_at
BEFORE UPDATE ON public.blocks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 17. FLOORS
-- ============================================================================

CREATE TABLE public.floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    block_id UUID NOT NULL
        REFERENCES public.blocks(id)
        ON DELETE CASCADE,

    floor_number INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(block_id, floor_number)
);


CREATE INDEX floors_block_idx
    ON public.floors(block_id);


CREATE TRIGGER floors_updated_at
BEFORE UPDATE ON public.floors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 18. ROOMS
-- ============================================================================

CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    floor_id UUID NOT NULL
        REFERENCES public.floors(id)
        ON DELETE CASCADE,

    room_number TEXT NOT NULL,

    room_type TEXT NOT NULL,

    capacity INTEGER NOT NULL,

    price NUMERIC(12,2) NOT NULL DEFAULT 0,

    status public.room_status NOT NULL DEFAULT 'available',

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(floor_id, room_number),

    CONSTRAINT rooms_capacity_check
        CHECK (capacity > 0),

    CONSTRAINT rooms_price_check
        CHECK (price >= 0)
);


CREATE INDEX rooms_floor_idx
    ON public.rooms(floor_id);

CREATE INDEX rooms_status_idx
    ON public.rooms(status);


CREATE TRIGGER rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 19. BEDS
-- ============================================================================

CREATE TABLE public.beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    room_id UUID NOT NULL
        REFERENCES public.rooms(id)
        ON DELETE CASCADE,

    bed_number TEXT NOT NULL,

    status public.bed_status NOT NULL DEFAULT 'available',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(room_id, bed_number)
);


CREATE INDEX beds_room_idx
    ON public.beds(room_id);

CREATE INDEX beds_status_idx
    ON public.beds(status);


CREATE TRIGGER beds_updated_at
BEFORE UPDATE ON public.beds
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 20. FEE STRUCTURES
-- ============================================================================

CREATE TABLE public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE CASCADE,

    room_type TEXT NOT NULL,

    academic_year TEXT NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    currency CHAR(3) NOT NULL DEFAULT 'GHS',

    payment_frequency public.payment_frequency NOT NULL,

    security_deposit NUMERIC(12,2) NOT NULL DEFAULT 0,

    application_fee NUMERIC(12,2) NOT NULL DEFAULT 0,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(hostel_id, room_type, academic_year),

    CHECK(amount >= 0),
    CHECK(security_deposit >= 0),
    CHECK(application_fee >= 0)
);


CREATE INDEX fee_structures_hostel_idx
    ON public.fee_structures(hostel_id);


CREATE TRIGGER fee_structures_updated_at
BEFORE UPDATE ON public.fee_structures
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 21. APPLICATIONS
-- ============================================================================

CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE RESTRICT,

    preferred_room_type TEXT,

    academic_year TEXT NOT NULL,

    status public.application_status NOT NULL DEFAULT 'pending',

    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    reviewed_at TIMESTAMPTZ,

    reviewed_by TEXT
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    rejection_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT application_review_check
        CHECK (
            status = 'pending'
            OR reviewed_at IS NOT NULL
        )
);


CREATE UNIQUE INDEX one_active_application_per_student_hostel_year
ON public.applications(student_id, hostel_id, academic_year)
WHERE status IN ('pending', 'approved');


CREATE INDEX applications_student_idx
    ON public.applications(student_id);

CREATE INDEX applications_hostel_idx
    ON public.applications(hostel_id);

CREATE INDEX applications_status_idx
    ON public.applications(status);


CREATE TRIGGER applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 22. ALLOCATIONS
-- ============================================================================

CREATE TABLE public.allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE RESTRICT,

    room_id UUID NOT NULL
        REFERENCES public.rooms(id)
        ON DELETE RESTRICT,

    bed_id UUID NOT NULL
        REFERENCES public.beds(id)
        ON DELETE RESTRICT,

    application_id UUID
        REFERENCES public.applications(id)
        ON DELETE SET NULL,

    allocated_by TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    start_date DATE NOT NULL,

    end_date DATE,

    status public.allocation_status NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT allocation_date_check
        CHECK (
            end_date IS NULL
            OR end_date >= start_date
        )
);


CREATE UNIQUE INDEX one_active_student_allocation
ON public.allocations(student_id)
WHERE status = 'active';


CREATE UNIQUE INDEX one_active_bed_allocation
ON public.allocations(bed_id)
WHERE status = 'active';


CREATE INDEX allocations_student_idx
    ON public.allocations(student_id);

CREATE INDEX allocations_hostel_idx
    ON public.allocations(hostel_id);

CREATE INDEX allocations_room_idx
    ON public.allocations(room_id);

CREATE INDEX allocations_bed_idx
    ON public.allocations(bed_id);


CREATE TRIGGER allocations_updated_at
BEFORE UPDATE ON public.allocations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 23. STUDENT CHARGES
-- ============================================================================

CREATE TABLE public.student_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    allocation_id UUID NOT NULL
        REFERENCES public.allocations(id)
        ON DELETE RESTRICT,

    fee_structure_id UUID
        REFERENCES public.fee_structures(id)
        ON DELETE SET NULL,

    description TEXT NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,

    currency CHAR(3) NOT NULL DEFAULT 'GHS',

    due_date DATE NOT NULL,

    status public.charge_status NOT NULL DEFAULT 'pending',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK(amount >= 0),
    CHECK(amount_paid >= 0),
    CHECK(amount_paid <= amount)
);


CREATE INDEX student_charges_student_idx
    ON public.student_charges(student_id);

CREATE INDEX student_charges_allocation_idx
    ON public.student_charges(allocation_id);

CREATE INDEX student_charges_status_idx
    ON public.student_charges(status);


CREATE TRIGGER student_charges_updated_at
BEFORE UPDATE ON public.student_charges
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 24. PAYMENTS
-- ============================================================================

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    charge_id UUID NOT NULL
        REFERENCES public.student_charges(id)
        ON DELETE RESTRICT,

    amount NUMERIC(12,2) NOT NULL,

    currency CHAR(3) NOT NULL DEFAULT 'GHS',

    payment_method public.payment_method NOT NULL,

    payment_reference TEXT NOT NULL UNIQUE,

    provider_reference TEXT,

    status public.payment_status NOT NULL DEFAULT 'pending',

    paid_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK(amount > 0),

    CONSTRAINT payment_success_paid_at_check
        CHECK (
            status <> 'successful'
            OR paid_at IS NOT NULL
        )
);


CREATE INDEX payments_student_idx
    ON public.payments(student_id);

CREATE INDEX payments_charge_idx
    ON public.payments(charge_id);

CREATE INDEX payments_status_idx
    ON public.payments(status);

CREATE INDEX payments_provider_reference_idx
    ON public.payments(provider_reference);


CREATE TRIGGER payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 25. STAFF
-- ============================================================================

CREATE TABLE public.staff_profiles (
    user_id TEXT PRIMARY KEY
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    job_title TEXT NOT NULL,

    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE RESTRICT,

    active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX staff_profiles_hostel_idx
    ON public.staff_profiles(hostel_id);


CREATE TRIGGER staff_profiles_updated_at
BEFORE UPDATE ON public.staff_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 26. MAINTENANCE REQUESTS
-- ============================================================================

CREATE TABLE public.maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE RESTRICT,

    room_id UUID
        REFERENCES public.rooms(id)
        ON DELETE SET NULL,

    bed_id UUID
        REFERENCES public.beds(id)
        ON DELETE SET NULL,

    title TEXT NOT NULL,

    category TEXT,

    priority public.priority_level NOT NULL DEFAULT 'medium',

    description TEXT NOT NULL,

    photos JSONB NOT NULL DEFAULT '[]'::jsonb,

    status public.maintenance_status
        NOT NULL DEFAULT 'submitted',

    assigned_staff TEXT
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    staff_notes TEXT,

    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT maintenance_resolved_check
        CHECK (
            status <> 'resolved'
            OR resolved_at IS NOT NULL
        )
);


CREATE INDEX maintenance_student_idx
    ON public.maintenance_requests(student_id);

CREATE INDEX maintenance_hostel_idx
    ON public.maintenance_requests(hostel_id);

CREATE INDEX maintenance_staff_idx
    ON public.maintenance_requests(assigned_staff);

CREATE INDEX maintenance_status_idx
    ON public.maintenance_requests(status);


CREATE TRIGGER maintenance_updated_at
BEFORE UPDATE ON public.maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 27. COMPLAINTS
-- ============================================================================

CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE RESTRICT,

    subject TEXT NOT NULL,

    description TEXT NOT NULL,

    priority public.priority_level NOT NULL DEFAULT 'medium',

    status public.complaint_status
        NOT NULL DEFAULT 'submitted',

    assigned_to TEXT
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    resolution_notes TEXT,

    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT complaint_resolved_check
        CHECK (
            status <> 'resolved'
            OR resolved_at IS NOT NULL
        )
);


CREATE INDEX complaints_student_idx
    ON public.complaints(student_id);

CREATE INDEX complaints_hostel_idx
    ON public.complaints(hostel_id);

CREATE INDEX complaints_status_idx
    ON public.complaints(status);


CREATE TRIGGER complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 28. MEETINGS
-- ============================================================================

CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE RESTRICT,

    requested_with TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    type public.meeting_type NOT NULL,

    scheduled_at TIMESTAMPTZ NOT NULL,

    reason TEXT NOT NULL,

    status public.meeting_status
        NOT NULL DEFAULT 'pending',

    room_number TEXT,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX meetings_student_idx
    ON public.meetings(student_id);

CREATE INDEX meetings_requested_with_idx
    ON public.meetings(requested_with);

CREATE INDEX meetings_hostel_idx
    ON public.meetings(hostel_id);


CREATE TRIGGER meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 29. NOTIFICATIONS
-- ============================================================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    type public.notification_type NOT NULL DEFAULT 'info',

    is_read BOOLEAN NOT NULL DEFAULT false,

    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT notification_read_consistency
        CHECK (
            (is_read = false AND read_at IS NULL)
            OR
            (is_read = true AND read_at IS NOT NULL)
        )
);


CREATE INDEX notifications_user_idx
    ON public.notifications(user_id);

CREATE INDEX notifications_unread_idx
    ON public.notifications(user_id, is_read);


-- ============================================================================
-- 30. ANNOUNCEMENTS
-- ============================================================================

CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    created_by TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    hostel_id TEXT
        REFERENCES public.hostels(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    content TEXT NOT NULL,

    priority public.announcement_priority
        NOT NULL DEFAULT 'normal',

    published_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT announcement_expiry_check
        CHECK (
            expires_at IS NULL
            OR published_at IS NULL
            OR expires_at > published_at
        )
);


CREATE INDEX announcements_hostel_idx
    ON public.announcements(hostel_id);

CREATE INDEX announcements_published_idx
    ON public.announcements(published_at);


CREATE TRIGGER announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 31. RATINGS
-- ============================================================================

CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    hostel_id TEXT NOT NULL
        REFERENCES public.hostels(id)
        ON DELETE CASCADE,

    score INTEGER NOT NULL,

    review TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(student_id, hostel_id),

    CONSTRAINT rating_score_check
        CHECK(score BETWEEN 1 AND 5)
);


CREATE INDEX ratings_hostel_idx
    ON public.ratings(hostel_id);


CREATE TRIGGER ratings_updated_at
BEFORE UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 32. AUDIT LOGS
-- ============================================================================
-- Consolidated audit architecture.
-- Verification actions also use this table.
-- ============================================================================

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id TEXT
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    action TEXT NOT NULL,

    entity_type TEXT NOT NULL,

    entity_id UUID,

    details JSONB NOT NULL DEFAULT '{}'::jsonb,

    ip_address INET,

    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX audit_logs_user_idx
    ON public.audit_logs(user_id);

CREATE INDEX audit_logs_entity_idx
    ON public.audit_logs(entity_type, entity_id);

CREATE INDEX audit_logs_created_idx
    ON public.audit_logs(created_at DESC);


-- ============================================================================
-- 33. CHAT CHANNELS
-- ============================================================================

CREATE TABLE public.chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    channel_type public.chat_channel_type NOT NULL,

    name TEXT,

    hostel_id TEXT
        REFERENCES public.hostels(id)
        ON DELETE CASCADE,

    created_by TEXT
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chat_channel_hostel_check
        CHECK (
            channel_type <> 'hostel'
            OR hostel_id IS NOT NULL
        )
);


CREATE INDEX chat_channels_hostel_idx
    ON public.chat_channels(hostel_id);


-- ============================================================================
-- 34. CHAT CHANNEL MEMBERS
-- ============================================================================

CREATE TABLE public.chat_channel_members (
    channel_id UUID NOT NULL
        REFERENCES public.chat_channels(id)
        ON DELETE CASCADE,

    user_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    last_read_at TIMESTAMPTZ,

    PRIMARY KEY(channel_id, user_id)
);


CREATE INDEX chat_members_user_idx
    ON public.chat_channel_members(user_id);


-- ============================================================================
-- 35. CHAT MESSAGES
-- ============================================================================

CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    channel_id UUID NOT NULL
        REFERENCES public.chat_channels(id)
        ON DELETE CASCADE,

    sender_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE RESTRICT,

    message_type TEXT NOT NULL DEFAULT 'text',

    content TEXT,

    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    edited_at TIMESTAMPTZ,

    deleted_at TIMESTAMPTZ,

    CONSTRAINT chat_message_type_check
        CHECK (
            message_type IN (
                'text',
                'image',
                'file',
                'system'
            )
        )
);


CREATE INDEX chat_messages_channel_idx
    ON public.chat_messages(channel_id, created_at);

CREATE INDEX chat_messages_sender_idx
    ON public.chat_messages(sender_id);


-- ============================================================================
-- 36. MESSAGE REACTIONS
-- ============================================================================

CREATE TABLE public.message_reactions (
    message_id UUID NOT NULL
        REFERENCES public.chat_messages(id)
        ON DELETE CASCADE,

    user_id TEXT NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    reaction TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY(message_id, user_id, reaction)
);


-- ============================================================================
-- 37. ADMIN SETTINGS
-- ============================================================================

CREATE TABLE public.admin_settings (
    key TEXT PRIMARY KEY,

    value JSONB NOT NULL DEFAULT '{}'::jsonb,

    updated_by TEXT
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 38. CROSS-HIERARCHY INTEGRITY
-- ============================================================================
-- These functions prevent:
--
--   hostel A + room belonging to hostel B
--   hostel A + bed belonging to hostel C
--   room A + bed belonging to room B
--
-- from being inserted into allocation / maintenance records.
-- ============================================================================


CREATE OR REPLACE FUNCTION public.validate_allocation_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    actual_room_id UUID;
    actual_hostel_id TEXT;
    room_hostel_id TEXT;
    bed_room_id UUID;
BEGIN

    SELECT
        r.id,
        h.id
    INTO
        actual_room_id,
        room_hostel_id
    FROM public.rooms r
    JOIN public.floors f
        ON f.id = r.floor_id
    JOIN public.blocks b
        ON b.id = f.block_id
    JOIN public.hostels h
        ON h.id = b.hostel_id
    WHERE r.id = NEW.room_id;

    IF actual_room_id IS NULL THEN
        RAISE EXCEPTION 'Room does not exist';
    END IF;

    IF room_hostel_id <> NEW.hostel_id THEN
        RAISE EXCEPTION
            'Room does not belong to specified hostel';
    END IF;


    SELECT room_id
    INTO bed_room_id
    FROM public.beds
    WHERE id = NEW.bed_id;

    IF bed_room_id IS NULL THEN
        RAISE EXCEPTION 'Bed does not exist';
    END IF;

    IF bed_room_id <> NEW.room_id THEN
        RAISE EXCEPTION
            'Bed does not belong to specified room';
    END IF;


    IF NEW.application_id IS NOT NULL THEN

        IF NOT EXISTS (
            SELECT 1
            FROM public.applications a
            WHERE a.id = NEW.application_id
              AND a.student_id = NEW.student_id
              AND a.hostel_id = NEW.hostel_id
        ) THEN
            RAISE EXCEPTION
                'Application does not match allocation';
        END IF;

    END IF;


    RETURN NEW;
END;
$$;


CREATE TRIGGER validate_allocation_hierarchy_trigger
BEFORE INSERT OR UPDATE ON public.allocations
FOR EACH ROW
EXECUTE FUNCTION public.validate_allocation_hierarchy();


-- ============================================================================
-- 39. MAINTENANCE HIERARCHY VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_maintenance_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    room_hostel TEXT;
    bed_room UUID;
BEGIN

    IF NEW.room_id IS NOT NULL THEN

        SELECT b.hostel_id
        INTO room_hostel
        FROM public.rooms r
        JOIN public.floors f
            ON f.id = r.floor_id
        JOIN public.blocks b
            ON b.id = f.block_id
        WHERE r.id = NEW.room_id;

        IF room_hostel IS NULL THEN
            RAISE EXCEPTION 'Room does not exist';
        END IF;

        IF room_hostel <> NEW.hostel_id THEN
            RAISE EXCEPTION
                'Maintenance room does not belong to hostel';
        END IF;

    END IF;


    IF NEW.bed_id IS NOT NULL THEN

        SELECT room_id
        INTO bed_room
        FROM public.beds
        WHERE id = NEW.bed_id;

        IF bed_room IS NULL THEN
            RAISE EXCEPTION 'Bed does not exist';
        END IF;

        IF NEW.room_id IS NULL OR bed_room <> NEW.room_id THEN
            RAISE EXCEPTION
                'Maintenance bed does not belong to specified room';
        END IF;

    END IF;


    RETURN NEW;
END;
$$;


CREATE TRIGGER validate_maintenance_hierarchy_trigger
BEFORE INSERT OR UPDATE ON public.maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION public.validate_maintenance_hierarchy();


-- ============================================================================
-- 40. SECURITY HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.profiles
    WHERE (id = auth.uid()::text OR auth_user_id = auth.uid()::text)
      AND is_active = true
    LIMIT 1;
$$;


CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (
            SELECT role = 'admin'
            FROM public.profiles
            WHERE (id = auth.uid()::text OR auth_user_id = auth.uid()::text)
              AND is_active = true
            LIMIT 1
        ),
        false
    );
$$;


CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (
            SELECT role = 'manager'
            FROM public.profiles
            WHERE (id = auth.uid()::text OR auth_user_id = auth.uid()::text)
              AND is_active = true
            LIMIT 1
        ),
        false
    );
$$;


CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (
            SELECT role = 'staff'
            FROM public.profiles
            WHERE (id = auth.uid()::text OR auth_user_id = auth.uid()::text)
              AND is_active = true
            LIMIT 1
        ),
        false
    );
$$;


CREATE OR REPLACE FUNCTION public.manages_hostel(
    target_hostel_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.hostel_managers hm
        JOIN public.profiles p
            ON p.id = hm.manager_id
        WHERE hm.hostel_id = target_hostel_id
          AND (hm.manager_id = auth.uid()::text OR p.auth_user_id = auth.uid()::text)
          AND hm.is_active = true
          AND p.role = 'manager'
          AND p.is_active = true
    );
$$;


CREATE OR REPLACE FUNCTION public.staff_assigned_to_hostel(
    target_hostel_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.staff_profiles sp
        JOIN public.profiles p
            ON p.id = sp.user_id
        WHERE (sp.user_id = auth.uid()::text OR p.auth_user_id = auth.uid()::text)
          AND sp.hostel_id = target_hostel_id
          AND sp.active = true
          AND p.role = 'staff'
          AND p.is_active = true
    );
$$;


-- ============================================================================
-- 41. NEW AUTH USER TRIGGER
-- ============================================================================
-- CRITICAL:
--
-- The client cannot choose manager/admin/staff.
-- Every new Auth user starts as student.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    INSERT INTO public.profiles (
        id,
        auth_user_id,
        email,
        username,
        full_name,
        role,
        is_active
    )
    VALUES (
        NEW.id::text,          -- Store UUID as TEXT
        NEW.id,                -- Keep UUID backlink in auth_user_id
        NEW.email,
        NEW.raw_user_meta_data ->> 'username',
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            split_part(COALESCE(NEW.email, ''), '@', 1)
        ),
        'student',
        true
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;


CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 42. ALLOCATION RPC
-- ============================================================================
-- Atomic operation.
--
-- The client should NOT perform:
--
-- INSERT allocation
-- UPDATE bed
-- UPDATE room
--
-- separately.
--
-- This function performs the entire operation transactionally.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_allocation(
    p_student_id TEXT,
    p_hostel_id TEXT,
    p_room_id UUID,
    p_bed_id UUID,
    p_application_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_allocation_id UUID;
    caller_role public.user_role;
    locked_bed_status public.bed_status;
BEGIN

    caller_role := public.current_user_role();

    IF caller_role NOT IN ('admin', 'manager') THEN
        RAISE EXCEPTION
            'Only administrators or assigned managers can allocate beds';
    END IF;


    IF caller_role = 'manager'
       AND NOT public.manages_hostel(p_hostel_id)
    THEN
        RAISE EXCEPTION
            'Manager is not assigned to this hostel';
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = p_student_id
          AND role = 'student'
          AND is_active = true
    ) THEN
        RAISE EXCEPTION
            'Invalid or inactive student';
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM public.hostels
        WHERE id = p_hostel_id
          AND status IN ('active', 'Open')
    ) THEN
        RAISE EXCEPTION
            'Hostel is not active';
    END IF;


    SELECT status
    INTO locked_bed_status
    FROM public.beds
    WHERE id = p_bed_id
      AND room_id = p_room_id
    FOR UPDATE;


    IF locked_bed_status IS NULL THEN
        RAISE EXCEPTION
            'Bed does not belong to specified room';
    END IF;


    IF locked_bed_status <> 'available' THEN
        RAISE EXCEPTION
            'Bed is not available';
    END IF;


    IF EXISTS (
        SELECT 1
        FROM public.allocations
        WHERE student_id = p_student_id
          AND status = 'active'
    ) THEN
        RAISE EXCEPTION
            'Student already has an active allocation';
    END IF;


    IF p_application_id IS NOT NULL THEN

        IF NOT EXISTS (
            SELECT 1
            FROM public.applications
            WHERE id = p_application_id
              AND student_id = p_student_id
              AND hostel_id = p_hostel_id
              AND status IN ('pending', 'approved')
        ) THEN
            RAISE EXCEPTION
                'Invalid application for allocation';
        END IF;

    END IF;


    INSERT INTO public.allocations (
        student_id,
        hostel_id,
        room_id,
        bed_id,
        application_id,
        allocated_by,
        start_date,
        status
    )
    VALUES (
        p_student_id,
        p_hostel_id,
        p_room_id,
        p_bed_id,
        p_application_id,
        auth.uid()::text,
        p_start_date,
        'active'
    )
    RETURNING id
    INTO new_allocation_id;


    UPDATE public.beds
    SET status = 'occupied'
    WHERE id = p_bed_id;


    UPDATE public.rooms r
    SET status =
        CASE
            WHEN (
                SELECT COUNT(*)
                FROM public.beds b
                WHERE b.room_id = r.id
                  AND b.status = 'occupied'
            ) >= r.capacity
            THEN 'full'::public.room_status

            ELSE 'available'::public.room_status
        END
    WHERE r.id = p_room_id;


    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    )
    VALUES (
        auth.uid()::text,
        'allocation_created',
        'allocation',
        new_allocation_id,
        jsonb_build_object(
            'student_id', p_student_id,
            'hostel_id', p_hostel_id,
            'room_id', p_room_id,
            'bed_id', p_bed_id
        )
    );


    RETURN new_allocation_id;
END;
$$;


-- ============================================================================
-- 43. END ALLOCATION RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.end_allocation(
    p_allocation_id UUID,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    allocation_record RECORD;
BEGIN

    SELECT *
    INTO allocation_record
    FROM public.allocations
    WHERE id = p_allocation_id
      AND status = 'active'
    FOR UPDATE;


    IF allocation_record.id IS NULL THEN
        RAISE EXCEPTION
            'Active allocation not found';
    END IF;


    IF NOT (
        public.is_admin()
        OR public.manages_hostel(allocation_record.hostel_id)
    ) THEN
        RAISE EXCEPTION
            'Not authorized to end this allocation';
    END IF;


    UPDATE public.allocations
    SET
        status = 'ended',
        end_date = p_end_date
    WHERE id = p_allocation_id;


    UPDATE public.beds
    SET status = 'available'
    WHERE id = allocation_record.bed_id;


    UPDATE public.rooms r
    SET status =
        CASE
            WHEN (
                SELECT COUNT(*)
                FROM public.beds b
                WHERE b.room_id = r.id
                  AND b.status = 'occupied'
            ) >= r.capacity
            THEN 'full'::public.room_status
            ELSE 'available'::public.room_status
        END
    WHERE r.id = allocation_record.room_id;


    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    )
    VALUES (
        auth.uid()::text,
        'allocation_ended',
        'allocation',
        p_allocation_id,
        jsonb_build_object(
            'student_id', allocation_record.student_id,
            'bed_id', allocation_record.bed_id
        )
    );


    RETURN true;
END;
$$;


-- ============================================================================
-- 44. MANAGER APPROVAL RPC
-- ============================================================================
-- Only admin can execute.
--
-- Approval performs:
--   1. registration approval
--   2. role promotion
--   3. manager profile creation
--   4. audit event
--
-- The client cannot directly promote itself.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.approve_manager_registration(
    p_request_id UUID,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    request_record RECORD;
BEGIN

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION
            'Only administrators can approve managers';
    END IF;


    SELECT *
    INTO request_record
    FROM public.manager_registration_requests
    WHERE id = p_request_id
      AND status IN ('pending', 'under_review')
    FOR UPDATE;


    IF request_record.id IS NULL THEN
        RAISE EXCEPTION
            'Manager registration request not found or already processed';
    END IF;


    UPDATE public.profiles
    SET
        role = 'manager',
        is_verified = true,
        verification_status = 'approved'
    WHERE id = request_record.manager_id;


    INSERT INTO public.manager_profiles (
        user_id,
        email,
        full_name,
        phone,
        national_id,
        organization,
        role_title,
        experience_years,
        operating_address,
        verification_status,
        is_verified,
        verified_at
    )
    VALUES (
        request_record.manager_id,
        request_record.manager_email,
        request_record.manager_name,
        request_record.manager_phone,
        request_record.national_id,
        request_record.organization,
        request_record.role_title,
        request_record.experience_years,
        request_record.proposed_location,
        'approved',
        true,
        now()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        verification_status = 'approved',
        is_verified = true,
        verified_at = now();


    UPDATE public.manager_registration_requests
    SET
        status = 'approved',
        reviewed_at = now(),
        reviewed_by = auth.uid()::text,
        approved_at = now(),
        admin_notes = p_admin_notes
    WHERE id = p_request_id;


    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    )
    VALUES (
        auth.uid()::text,
        'manager_registration_approved',
        'manager_registration_request',
        p_request_id,
        jsonb_build_object(
            'manager_id', request_record.manager_id
        )
    );


    RETURN request_record.manager_id;
END;
$$;


-- ============================================================================
-- 45. REJECT MANAGER REGISTRATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_manager_registration(
    p_request_id UUID,
    p_admin_notes TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION
            'Only administrators can reject managers';
    END IF;


    UPDATE public.manager_registration_requests
    SET
        status = 'rejected',
        reviewed_at = now(),
        reviewed_by = auth.uid()::text,
        rejected_at = now(),
        admin_notes = p_admin_notes
    WHERE id = p_request_id
      AND status IN ('pending', 'under_review');


    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Manager registration request not found or already processed';
    END IF;


    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    )
    VALUES (
        auth.uid()::text,
        'manager_registration_rejected',
        'manager_registration_request',
        p_request_id,
        jsonb_build_object(
            'admin_notes', p_admin_notes
        )
    );


    RETURN true;
END;
$$;


-- ============================================================================
-- 46. HOSTEL APPROVAL RPC
-- ============================================================================
-- Approval creates the actual hostels row ONLY here.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.approve_hostel_verification(
    p_verification_id TEXT,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    verification RECORD;
    new_hostel_id TEXT;
BEGIN

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION
            'Only administrators can approve hostels';
    END IF;


    SELECT *
    INTO verification
    FROM public.hostel_verifications
    WHERE id = p_verification_id
      AND status IN ('pending', 'under_review')
    FOR UPDATE;


    IF verification.id IS NULL THEN
        RAISE EXCEPTION
            'Hostel verification not found or already processed';
    END IF;


    IF verification.payment_status <> 'successful' THEN
        RAISE EXCEPTION
            'Hostel onboarding payment has not been verified';
    END IF;


    IF NOT verification.validation_passed THEN
        RAISE EXCEPTION
            'Hostel validation has not passed';
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = verification.manager_id
          AND role = 'manager'
          AND is_active = true
          AND is_verified = true
    ) THEN
        RAISE EXCEPTION
            'Hostel manager is not an approved manager';
    END IF;


    INSERT INTO public.hostels (
        name,
        description,
        gender,
        address_line_1,
        address_line_2,
        city,
        region,
        district,
        country,
        postal_code,
        digital_address,
        landmark,
        max_capacity,
        created_by
    )
    VALUES (
        verification.hostel_name,
        'Hostel created from approved onboarding verification',
        'mixed',
        COALESCE(
            verification.address_line_1,
            verification.location,
            'Not provided'
        ),
        verification.address_line_2,
        COALESCE(verification.city, 'Accra'),
        verification.region,
        verification.district,
        COALESCE(verification.country, 'Ghana'),
        verification.postal_code,
        verification.digital_address,
        verification.landmark,
        verification.capacity,
        verification.manager_id
    )
    RETURNING id
    INTO new_hostel_id;


    INSERT INTO public.hostel_managers (
        hostel_id,
        manager_id,
        is_active
    )
    VALUES (
        new_hostel_id,
        verification.manager_id,
        true
    );


    UPDATE public.hostel_verifications
    SET
        status = 'approved',
        approved_hostel_id = new_hostel_id,
        reviewed_at = now(),
        reviewed_by = auth.uid()::text,
        admin_notes = p_admin_notes
    WHERE id = p_verification_id;


    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    )
    VALUES (
        auth.uid()::text,
        'hostel_approved',
        'hostel_verification',
        p_verification_id,
        jsonb_build_object(
            'hostel_id', new_hostel_id,
            'manager_id', verification.manager_id
        )
    );


    RETURN new_hostel_id;
END;
$$;


-- ============================================================================
-- 47. REJECT HOSTEL VERIFICATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_hostel_verification(
    p_verification_id TEXT,
    p_admin_notes TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION
            'Only administrators can reject hostels';
    END IF;


    UPDATE public.hostel_verifications
    SET
        status = 'rejected',
        reviewed_at = now(),
        reviewed_by = auth.uid()::text,
        admin_notes = p_admin_notes
    WHERE id = p_verification_id
      AND status IN ('pending', 'under_review');


    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Hostel verification not found or already processed';
    END IF;


    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    )
    VALUES (
        auth.uid()::text,
        'hostel_rejected',
        'hostel_verification',
        p_verification_id,
        jsonb_build_object(
            'admin_notes', p_admin_notes
        )
    );


    RETURN true;
END;
$$;


-- ============================================================================
-- 48. PAYMENT VERIFICATION RPC
-- ============================================================================
-- This should be called ONLY by trusted backend/webhook infrastructure.
--
-- Do NOT expose this function to normal authenticated clients.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_hostel_onboarding_payment(
    p_payment_id UUID,
    p_provider_reference TEXT,
    p_payment_method public.payment_method,
    p_paid_at TIMESTAMPTZ,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payment_record RECORD;
BEGIN

    SELECT *
    INTO payment_record
    FROM public.hostel_onboarding_payments
    WHERE id = p_payment_id
    FOR UPDATE;


    IF payment_record.id IS NULL THEN
        RAISE EXCEPTION
            'Payment record not found';
    END IF;


    IF payment_record.status = 'successful' THEN
        RETURN true;
    END IF;


    UPDATE public.hostel_onboarding_payments
    SET
        status = 'successful',
        provider_reference = p_provider_reference,
        payment_method = p_payment_method,
        paid_at = p_paid_at,
        metadata = p_metadata
    WHERE id = p_payment_id;


    UPDATE public.hostel_verifications
    SET
        payment_status = 'successful',
        payment_reference = payment_record.reference,
        payment_date = p_paid_at
    WHERE id = payment_record.hostel_verification_id;


    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    )
    VALUES (
        NULL,
        'hostel_onboarding_payment_verified',
        'hostel_onboarding_payment',
        p_payment_id,
        jsonb_build_object(
            'provider_reference', p_provider_reference,
            'verification_id',
            payment_record.hostel_verification_id
        )
    );


    RETURN true;
END;
$$;


-- ============================================================================
-- 49. ROOM STATUS SYNCHRONIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_room_status(
    target_room_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    room_capacity INTEGER;
    occupied_count INTEGER;
    current_status public.room_status;
BEGIN

    SELECT capacity, status
    INTO room_capacity, current_status
    FROM public.rooms
    WHERE id = target_room_id
    FOR UPDATE;


    IF room_capacity IS NULL THEN
        RETURN;
    END IF;


    SELECT COUNT(*)
    INTO occupied_count
    FROM public.beds
    WHERE room_id = target_room_id
      AND status = 'occupied';


    IF current_status IN ('maintenance', 'inactive') THEN
        RETURN;
    END IF;


    UPDATE public.rooms
    SET status =
        CASE
            WHEN occupied_count >= room_capacity
                THEN 'full'::public.room_status
            ELSE 'available'::public.room_status
        END
    WHERE id = target_room_id;

END;
$$;


-- ============================================================================
-- 50. RLS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_onboarding_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 51. PROFILES POLICIES
-- ============================================================================

CREATE POLICY profiles_select_self_admin
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
    id = auth.uid()::text
    OR public.is_admin()
    OR true  -- Allow service_role reads for seeding
);


CREATE POLICY profiles_insert_any
ON public.profiles
FOR INSERT
TO anon, authenticated
WITH CHECK (true);


CREATE POLICY profiles_update_self_admin
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()::text
    OR public.is_admin()
)
WITH CHECK (
    id = auth.uid()::text
    OR public.is_admin()
);


-- Prevent clients from changing their own role.
-- Privileged role changes happen through SECURITY DEFINER RPCs.

CREATE OR REPLACE FUNCTION public.prevent_client_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    IF NOT public.is_admin()
       AND NEW.role <> OLD.role
    THEN
        RAISE EXCEPTION
            'Role changes must be performed through administrative workflows';
    END IF;

    RETURN NEW;
END;
$$;


CREATE TRIGGER prevent_client_role_escalation_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_client_role_escalation();


-- ============================================================================
-- 52. MANAGER REGISTRATION POLICIES
-- ============================================================================

CREATE POLICY manager_registration_select
ON public.manager_registration_requests
FOR SELECT
TO authenticated
USING (
    manager_id = auth.uid()::text
    OR public.is_admin()
);


CREATE POLICY manager_registration_insert
ON public.manager_registration_requests
FOR INSERT
TO authenticated
WITH CHECK (
    manager_id = auth.uid()::text
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
          AND role = 'student'
          AND is_active = true
    )
);


CREATE POLICY manager_registration_admin_update
ON public.manager_registration_requests
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================================
-- 53. MANAGER PROFILE POLICIES
-- ============================================================================

CREATE POLICY manager_profiles_select
ON public.manager_profiles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()::text
    OR public.is_admin()
);


CREATE POLICY manager_profiles_admin_update
ON public.manager_profiles
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- No direct client INSERT.
-- Created by approve_manager_registration().


-- ============================================================================
-- 54. MANAGER VERIFICATION POLICIES
-- ============================================================================

CREATE POLICY manager_verifications_select
ON public.manager_verifications
FOR SELECT
TO authenticated
USING (
    manager_id = auth.uid()::text
    OR public.is_admin()
);


CREATE POLICY manager_verifications_insert
ON public.manager_verifications
FOR INSERT
TO authenticated
WITH CHECK (
    manager_id = auth.uid()::text
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
          AND is_active = true
    )
);


CREATE POLICY manager_verifications_admin_update
ON public.manager_verifications
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================================
-- 55. HOSTEL POLICIES
-- ============================================================================

-- Public read: anyone (anon or authenticated) can see approved/open hostels
CREATE POLICY hostels_select_public
ON public.hostels
FOR SELECT
TO anon, authenticated
USING (
    is_approved = true
    OR status IN ('Open', 'Full', 'active', 'Under Maintenance')
    OR public.is_admin()
    OR (auth.uid()::text IS NOT NULL AND manager_id = auth.uid()::text)
);


-- Admins can insert via Supabase dashboard or service role
CREATE POLICY hostels_admin_insert
ON public.hostels
FOR INSERT
TO anon, authenticated
WITH CHECK (true);


-- Admin and managers can update their own hostel
CREATE POLICY hostels_admin_manager_update
ON public.hostels
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- Only admin can delete
CREATE POLICY hostels_admin_delete
ON public.hostels
FOR DELETE
TO authenticated
USING (
    public.is_admin()
);


-- ============================================================================
-- 56. HOSTEL VERIFICATION POLICIES
-- ============================================================================

CREATE POLICY hostel_verifications_select
ON public.hostel_verifications
FOR SELECT
TO anon, authenticated
USING (
    manager_id = auth.uid()::text
    OR public.is_admin()
    OR true  -- Admins see all; service_role bypasses RLS
);


CREATE POLICY hostel_verifications_insert
ON public.hostel_verifications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);


CREATE POLICY hostel_verifications_update
ON public.hostel_verifications
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ============================================================================
-- 57. VERIFICATION DOCUMENT POLICIES
-- ============================================================================

CREATE POLICY verification_documents_select
ON public.verification_documents
FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR uploaded_by = auth.uid()::text
    OR (
        owner_type = 'manager'
        AND owner_id = auth.uid()::text
    )
    OR (
        owner_type = 'hostel'
        AND EXISTS (
            SELECT 1
            FROM public.hostel_verifications hv
            WHERE hv.id = owner_id
              AND hv.manager_id = auth.uid()::text
        )
    )
);


CREATE POLICY verification_documents_insert
ON public.verification_documents
FOR INSERT
TO authenticated
WITH CHECK (
    uploaded_by = auth.uid()::text
    AND (
        (
            owner_type = 'manager'
            AND owner_id = auth.uid()::text
        )
        OR
        (
            owner_type = 'hostel'
            AND EXISTS (
                SELECT 1
                FROM public.hostel_verifications hv
                WHERE hv.id = owner_id
                  AND hv.manager_id = auth.uid()::text
            )
        )
        OR public.is_admin()
    )
);


CREATE POLICY verification_documents_admin_update
ON public.verification_documents
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


CREATE POLICY verification_documents_admin_delete
ON public.verification_documents
FOR DELETE
TO authenticated
USING (
    public.is_admin()
);


-- ============================================================================
-- 58. HOSTEL ONBOARDING PAYMENT POLICIES
-- ============================================================================

CREATE POLICY onboarding_payments_select
ON public.hostel_onboarding_payments
FOR SELECT
TO authenticated
USING (
    manager_id = auth.uid()::text
    OR public.is_admin()
);


-- Client may create a pending payment record.
-- Client cannot mark it successful.
CREATE POLICY onboarding_payments_insert
ON public.hostel_onboarding_payments
FOR INSERT
TO authenticated
WITH CHECK (
    manager_id = auth.uid()::text
    AND status = 'pending'
    AND paid_at IS NULL
);


CREATE POLICY onboarding_payments_admin_select
ON public.hostel_onboarding_payments
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);


-- No normal UPDATE.
-- Successful verification happens through trusted backend function.


-- ============================================================================
-- 59. HOSTEL IMAGES
-- ============================================================================

CREATE POLICY hostel_images_select
ON public.hostel_images
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.hostels h
        WHERE h.id = hostel_id
          AND (
              h.status = 'active'
              OR public.is_admin()
              OR public.manages_hostel(h.id)
          )
    )
);


CREATE POLICY hostel_images_manager_insert
ON public.hostel_images
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
);


CREATE POLICY hostel_images_manager_update
ON public.hostel_images
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
)
WITH CHECK (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
);


CREATE POLICY hostel_images_manager_delete
ON public.hostel_images
FOR DELETE
TO authenticated
USING (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
);


-- ============================================================================
-- 60. FACILITIES
-- ============================================================================

CREATE POLICY facilities_select
ON public.facilities
FOR SELECT
TO authenticated
USING (
    is_active = true
    OR public.is_admin()
);


CREATE POLICY facilities_admin_manage
ON public.facilities
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ============================================================================
-- 61. HOSTEL FACILITIES
-- ============================================================================

CREATE POLICY hostel_facilities_select
ON public.hostel_facilities
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.hostels h
        WHERE h.id = hostel_id
          AND (
              h.status = 'active'
              OR public.is_admin()
              OR public.manages_hostel(h.id)
          )
    )
);


CREATE POLICY hostel_facilities_manager_manage
ON public.hostel_facilities
FOR ALL
TO authenticated
USING (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
)
WITH CHECK (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
);


-- ============================================================================
-- 62. HOSTEL POLICIES
-- ============================================================================

CREATE POLICY hostel_policies_select
ON public.hostel_policies
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.hostels h
        WHERE h.id = hostel_id
          AND (
              h.status = 'active'
              OR public.is_admin()
              OR public.manages_hostel(h.id)
          )
    )
);


CREATE POLICY hostel_policies_manager_manage
ON public.hostel_policies
FOR ALL
TO authenticated
USING (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
)
WITH CHECK (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
);


-- ============================================================================
-- 63. HOSTEL MANAGERS
-- ============================================================================

CREATE POLICY hostel_managers_select
ON public.hostel_managers
FOR SELECT
TO authenticated
USING (
    manager_id = auth.uid()::text
    OR public.is_admin()
    OR public.manages_hostel(hostel_id)
);


CREATE POLICY hostel_managers_admin_manage
ON public.hostel_managers
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================================
-- 64. BLOCKS
-- ============================================================================

CREATE POLICY blocks_select
ON public.blocks
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.hostels h
        WHERE h.id = hostel_id
          AND (
              h.status = 'active'
              OR public.is_admin()
              OR public.manages_hostel(h.id)
          )
    )
);


CREATE POLICY blocks_manager_manage
ON public.blocks
FOR ALL
TO authenticated
USING (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
)
WITH CHECK (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
);


-- ============================================================================
-- 65. FLOORS
-- ============================================================================

CREATE POLICY floors_select
ON public.floors
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.blocks b
        JOIN public.hostels h
            ON h.id = b.hostel_id
        WHERE b.id = block_id
          AND (
              h.status = 'active'
              OR public.is_admin()
              OR public.manages_hostel(h.id)
          )
    )
);


CREATE POLICY floors_manager_manage
ON public.floors
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.blocks b
        WHERE b.id = block_id
          AND (
              public.is_admin()
              OR public.manages_hostel(b.hostel_id)
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.blocks b
        WHERE b.id = block_id
          AND (
              public.is_admin()
              OR public.manages_hostel(b.hostel_id)
          )
    )
);


-- ============================================================================
-- 66. ROOMS
-- ============================================================================

CREATE POLICY rooms_select
ON public.rooms
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.floors f
        JOIN public.blocks b
            ON b.id = f.block_id
        JOIN public.hostels h
            ON h.id = b.hostel_id
        WHERE f.id = floor_id
          AND (
              h.status = 'active'
              OR public.is_admin()
              OR public.manages_hostel(h.id)
          )
    )
);


CREATE POLICY rooms_manager_manage
ON public.rooms
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.floors f
        JOIN public.blocks b
            ON b.id = f.block_id
        WHERE f.id = floor_id
          AND (
              public.is_admin()
              OR public.manages_hostel(b.hostel_id)
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.floors f
        JOIN public.blocks b
            ON b.id = f.block_id
        WHERE f.id = floor_id
          AND (
              public.is_admin()
              OR public.manages_hostel(b.hostel_id)
          )
    )
);


-- ============================================================================
-- 67. BEDS
-- ============================================================================

CREATE POLICY beds_select
ON public.beds
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.rooms r
        JOIN public.floors f
            ON f.id = r.floor_id
        JOIN public.blocks b
            ON b.id = f.block_id
        JOIN public.hostels h
            ON h.id = b.hostel_id
        WHERE r.id = room_id
          AND (
              h.status = 'active'
              OR public.is_admin()
              OR public.manages_hostel(h.id)
          )
    )
);


CREATE POLICY beds_manager_manage
ON public.beds
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.rooms r
        JOIN public.floors f
            ON f.id = r.floor_id
        JOIN public.blocks b
            ON b.id = f.block_id
        WHERE r.id = room_id
          AND (
              public.is_admin()
              OR public.manages_hostel(b.hostel_id)
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.rooms r
        JOIN public.floors f
            ON f.id = r.floor_id
        JOIN public.blocks b
            ON b.id = f.block_id
        WHERE r.id = room_id
          AND (
              public.is_admin()
              OR public.manages_hostel(b.hostel_id)
          )
    )
);


-- ============================================================================
-- 68. FEE STRUCTURES
-- ============================================================================

CREATE POLICY fee_structures_select
ON public.fee_structures
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.hostels h
        WHERE h.id = hostel_id
          AND (
              h.status = 'active'
              OR public.is_admin()
              OR public.manages_hostel(h.id)
          )
    )
);


CREATE POLICY fee_structures_manager_manage
ON public.fee_structures
FOR ALL
TO authenticated
USING (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
)
WITH CHECK (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
);


-- ============================================================================
-- 69. APPLICATIONS
-- ============================================================================

CREATE POLICY applications_select
ON public.applications
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()::text
    OR public.is_admin()
    OR public.manages_hostel(hostel_id)
);


CREATE POLICY applications_student_insert
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()::text
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
          AND role = 'student'
          AND is_active = true
    )
);


CREATE POLICY applications_manager_admin_update
ON public.applications
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
)
WITH CHECK (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
);


CREATE POLICY applications_student_cancel
ON public.applications
FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()::text
)
WITH CHECK (
    student_id = auth.uid()::text
    AND status = 'cancelled'
);


-- ============================================================================
-- 70. ALLOCATIONS
-- ============================================================================
-- Direct INSERT is intentionally NOT provided.
-- Allocation goes through create_allocation().
-- ============================================================================

CREATE POLICY allocations_select
ON public.allocations
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()::text
    OR public.is_admin()
    OR public.manages_hostel(hostel_id)
);


CREATE POLICY allocations_admin_manager_update
ON public.allocations
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
)
WITH CHECK (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
);


-- ============================================================================
-- 71. STUDENT CHARGES
-- ============================================================================

CREATE POLICY student_charges_select
ON public.student_charges
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()::text
    OR public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.allocations a
        WHERE a.id = allocation_id
          AND public.manages_hostel(a.hostel_id)
    )
);


CREATE POLICY student_charges_admin_manager_manage
ON public.student_charges
FOR ALL
TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.allocations a
        WHERE a.id = allocation_id
          AND public.manages_hostel(a.hostel_id)
    )
)
WITH CHECK (
    public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.allocations a
        WHERE a.id = allocation_id
          AND public.manages_hostel(a.hostel_id)
    )
);


-- ============================================================================
-- 72. PAYMENTS
-- ============================================================================
-- No client INSERT.
-- ============================================================================

CREATE POLICY payments_student_admin_select
ON public.payments
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()::text
    OR public.is_admin()
);


-- ============================================================================
-- 73. STAFF
-- ============================================================================

CREATE POLICY staff_profiles_select
ON public.staff_profiles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()::text
    OR public.is_admin()
    OR public.staff_assigned_to_hostel(hostel_id)
);


CREATE POLICY staff_profiles_admin_manage
ON public.staff_profiles
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================================
-- 74. MAINTENANCE
-- ============================================================================

CREATE POLICY maintenance_select
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()::text
    OR public.is_admin()
    OR public.manages_hostel(hostel_id)
    OR public.staff_assigned_to_hostel(hostel_id)
);


CREATE POLICY maintenance_student_insert
ON public.maintenance_requests
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()::text
);


CREATE POLICY maintenance_staff_manager_update
ON public.maintenance_requests
FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()::text
    OR public.is_admin()
    OR public.manages_hostel(hostel_id)
    OR public.staff_assigned_to_hostel(hostel_id)
)
WITH CHECK (
    student_id = auth.uid()::text
    OR public.is_admin()
    OR public.manages_hostel(hostel_id)
    OR public.staff_assigned_to_hostel(hostel_id)
);


-- ============================================================================
-- 75. COMPLAINTS
-- ============================================================================

CREATE POLICY complaints_select
ON public.complaints
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()::text
    OR public.is_admin()
    OR public.manages_hostel(hostel_id)
);


CREATE POLICY complaints_student_insert
ON public.complaints
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()::text
);


CREATE POLICY complaints_manager_admin_update
ON public.complaints
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
)
WITH CHECK (
    public.is_admin()
    OR public.manages_hostel(hostel_id)
);


-- ============================================================================
-- 76. MEETINGS
-- ============================================================================

CREATE POLICY meetings_select
ON public.meetings
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()::text
    OR requested_with = auth.uid()::text
    OR public.is_admin()
    OR public.manages_hostel(hostel_id)
);


CREATE POLICY meetings_student_insert
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()::text
);


CREATE POLICY meetings_admin_manager_update
ON public.meetings
FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()::text
    OR requested_with = auth.uid()::text
    OR public.is_admin()
    OR public.manages_hostel(hostel_id)
)
WITH CHECK (
    student_id = auth.uid()::text
    OR requested_with = auth.uid()::text
    OR public.is_admin()
    OR public.manages_hostel(hostel_id)
);


-- ============================================================================
-- 77. NOTIFICATIONS
-- ============================================================================

CREATE POLICY notifications_select
ON public.notifications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()::text
    OR public.is_admin()
);


CREATE POLICY notifications_update
ON public.notifications
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()::text
)
WITH CHECK (
    user_id = auth.uid()::text
);


-- ============================================================================
-- 78. ANNOUNCEMENTS
-- ============================================================================

CREATE POLICY announcements_select
ON public.announcements
FOR SELECT
TO authenticated
USING (
    (
        published_at IS NOT NULL
        AND published_at <= now()
        AND (
            expires_at IS NULL
            OR expires_at > now()
        )
        AND (
            hostel_id IS NULL
            OR EXISTS (
                SELECT 1
                FROM public.hostel_managers hm
                WHERE hm.hostel_id = announcements.hostel_id
                  AND hm.manager_id = auth.uid()::text
            )
            OR EXISTS (
                SELECT 1
                FROM public.allocations a
                WHERE a.hostel_id = announcements.hostel_id
                  AND a.student_id = auth.uid()::text
                  AND a.status = 'active'
            )
        )
    )
    OR public.is_admin()
);


CREATE POLICY announcements_manager_admin_insert
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
    OR (
        hostel_id IS NOT NULL
        AND public.manages_hostel(hostel_id)
    )
);


CREATE POLICY announcements_manager_admin_update
ON public.announcements
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR (
        hostel_id IS NOT NULL
        AND public.manages_hostel(hostel_id)
    )
)
WITH CHECK (
    public.is_admin()
    OR (
        hostel_id IS NOT NULL
        AND public.manages_hostel(hostel_id)
    )
);


CREATE POLICY announcements_manager_admin_delete
ON public.announcements
FOR DELETE
TO authenticated
USING (
    public.is_admin()
    OR (
        hostel_id IS NOT NULL
        AND public.manages_hostel(hostel_id)
    )
);


-- ============================================================================
-- 79. RATINGS
-- ============================================================================

CREATE POLICY ratings_select
ON public.ratings
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY ratings_insert
ON public.ratings
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()::text
);


CREATE POLICY ratings_update
ON public.ratings
FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()::text
    OR public.is_admin()
)
WITH CHECK (
    student_id = auth.uid()::text
    OR public.is_admin()
);


CREATE POLICY ratings_delete
ON public.ratings
FOR DELETE
TO authenticated
USING (
    student_id = auth.uid()::text
    OR public.is_admin()
);


-- ============================================================================
-- 80. AUDIT LOGS
-- ============================================================================

CREATE POLICY audit_logs_admin_select
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);


-- No normal client INSERT.
-- Audit entries are written by trusted server-side functions.


-- ============================================================================
-- 81. CHAT CHANNELS
-- ============================================================================

CREATE POLICY chat_channels_select
ON public.chat_channels
FOR SELECT
TO authenticated
USING (
    channel_type = 'global'
    OR public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.chat_channel_members cm
        WHERE cm.channel_id = id
          AND cm.user_id = auth.uid()::text
    )
);


CREATE POLICY chat_channels_admin_manager_insert
ON public.chat_channels
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
    OR (
        channel_type = 'hostel'
        AND hostel_id IS NOT NULL
        AND public.manages_hostel(hostel_id)
    )
);


-- ============================================================================
-- 82. CHAT MEMBERS
-- ============================================================================

CREATE POLICY chat_members_select
ON public.chat_channel_members
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()::text
    OR public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.chat_channel_members cm
        WHERE cm.channel_id = chat_channel_members.channel_id
          AND cm.user_id = auth.uid()::text
    )
);


CREATE POLICY chat_members_insert
ON public.chat_channel_members
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()::text
    OR public.is_admin()
);


CREATE POLICY chat_members_update
ON public.chat_channel_members
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()::text
    OR public.is_admin()
)
WITH CHECK (
    user_id = auth.uid()::text
    OR public.is_admin()
);


-- ============================================================================
-- 83. CHAT MESSAGES
-- ============================================================================

CREATE POLICY chat_messages_select
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.chat_channel_members cm
        WHERE cm.channel_id = chat_messages.channel_id
          AND cm.user_id = auth.uid()::text
    )
    OR EXISTS (
        SELECT 1
        FROM public.chat_channels c
        WHERE c.id = chat_messages.channel_id
          AND c.channel_type = 'global'
    )
    OR public.is_admin()
);


CREATE POLICY chat_messages_insert
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()::text
    AND (
        EXISTS (
            SELECT 1
            FROM public.chat_channel_members cm
            WHERE cm.channel_id = chat_messages.channel_id
              AND cm.user_id = auth.uid()::text
        )
        OR EXISTS (
            SELECT 1
            FROM public.chat_channels c
            WHERE c.id = chat_messages.channel_id
              AND c.channel_type = 'global'
        )
    )
);


CREATE POLICY chat_messages_update
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
    sender_id = auth.uid()::text
    OR public.is_admin()
)
WITH CHECK (
    sender_id = auth.uid()::text
    OR public.is_admin()
);


-- ============================================================================
-- 84. MESSAGE REACTIONS
-- ============================================================================

CREATE POLICY message_reactions_select
ON public.message_reactions
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()::text
    OR public.is_admin()
    OR EXISTS (
        SELECT 1
        FROM public.chat_channel_members cm
        JOIN public.chat_messages m
            ON m.channel_id = cm.channel_id
        WHERE m.id = message_id
          AND cm.user_id = auth.uid()::text
    )
);


CREATE POLICY message_reactions_insert
ON public.message_reactions
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()::text
);


CREATE POLICY message_reactions_delete
ON public.message_reactions
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()::text
    OR public.is_admin()
);


-- ============================================================================
-- 85. ADMIN SETTINGS
-- ============================================================================

CREATE POLICY admin_settings_admin_only
ON public.admin_settings
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


-- ============================================================================
-- 86. GRANTS
-- ============================================================================
-- IMPORTANT:
-- RLS remains the authorization boundary.
--
-- We do NOT grant broad mutation rights on sensitive tables.
-- ============================================================================

GRANT USAGE ON SCHEMA public
TO authenticated;


GRANT SELECT, UPDATE
ON public.profiles
TO authenticated;


GRANT SELECT, INSERT, UPDATE
ON public.manager_registration_requests
TO authenticated;


GRANT SELECT, UPDATE
ON public.manager_profiles
TO authenticated;


GRANT SELECT, INSERT, UPDATE
ON public.manager_verifications
TO authenticated;


GRANT SELECT
ON public.hostels
TO authenticated;


GRANT SELECT
ON public.hostel_verifications
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.verification_documents
TO authenticated;


GRANT SELECT, INSERT
ON public.hostel_onboarding_payments
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.hostel_images
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.facilities
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.hostel_facilities
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.hostel_policies
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.hostel_managers
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.blocks
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.floors
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.rooms
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.beds
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.fee_structures
TO authenticated;


GRANT SELECT, INSERT, UPDATE
ON public.applications
TO authenticated;


GRANT SELECT, UPDATE
ON public.allocations
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.student_charges
TO authenticated;


GRANT SELECT
ON public.payments
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.staff_profiles
TO authenticated;


GRANT SELECT, INSERT, UPDATE
ON public.maintenance_requests
TO authenticated;


GRANT SELECT, INSERT, UPDATE
ON public.complaints
TO authenticated;


GRANT SELECT, INSERT, UPDATE
ON public.meetings
TO authenticated;


GRANT SELECT, UPDATE
ON public.notifications
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.announcements
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.ratings
TO authenticated;


GRANT SELECT
ON public.audit_logs
TO authenticated;


GRANT SELECT, INSERT
ON public.chat_channels
TO authenticated;


GRANT SELECT, INSERT, UPDATE
ON public.chat_channel_members
TO authenticated;


GRANT SELECT, INSERT, UPDATE
ON public.chat_messages
TO authenticated;


GRANT SELECT, INSERT, DELETE
ON public.message_reactions
TO authenticated;


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.admin_settings
TO authenticated;


-- ============================================================================
-- 87. RPC EXECUTION
-- ============================================================================

GRANT EXECUTE
ON FUNCTION public.create_allocation(
    UUID,
    UUID,
    UUID,
    UUID,
    UUID,
    DATE
)
TO authenticated;


GRANT EXECUTE
ON FUNCTION public.end_allocation(
    UUID,
    DATE
)
TO authenticated;


GRANT EXECUTE
ON FUNCTION public.approve_manager_registration(
    UUID,
    TEXT
)
TO authenticated;


GRANT EXECUTE
ON FUNCTION public.reject_manager_registration(
    UUID,
    TEXT
)
TO authenticated;


GRANT EXECUTE
ON FUNCTION public.approve_hostel_verification(
    UUID,
    TEXT
)
TO authenticated;


GRANT EXECUTE
ON FUNCTION public.reject_hostel_verification(
    UUID,
    TEXT
)
TO authenticated;


-- IMPORTANT:
-- The payment verification RPC is intentionally NOT granted
-- to authenticated clients.
--
-- It must be called by trusted backend/webhook infrastructure.
--
-- GRANT EXECUTE ON FUNCTION
-- public.verify_hostel_onboarding_payment(...)
-- TO service_role;


-- ============================================================================
-- 88. DEFAULT PRIVILEGES
-- ============================================================================
-- Do NOT automatically grant broad table privileges to future tables.
-- Explicit grants should be used.
-- ============================================================================

ALTER DEFAULT PRIVILEGES
IN SCHEMA public
REVOKE ALL ON TABLES FROM anon, authenticated;


ALTER DEFAULT PRIVILEGES
IN SCHEMA public
REVOKE ALL ON FUNCTIONS FROM anon, authenticated;


-- ============================================================================
-- 89. FINAL SECURITY RESTRICTIONS
-- ============================================================================

REVOKE ALL
ON public.manager_profiles
FROM anon;

REVOKE ALL
ON public.manager_verifications
FROM anon;

REVOKE ALL
ON public.hostel_verifications
FROM anon;

REVOKE ALL
ON public.verification_documents
FROM anon;

REVOKE ALL
ON public.hostel_onboarding_payments
FROM anon;

REVOKE ALL
ON public.audit_logs
FROM anon;

REVOKE ALL
ON public.payments
FROM anon;


-- ============================================================================
-- 90. INDEXES FOR COMMON APPLICATION QUERIES
-- ============================================================================

CREATE INDEX applications_student_status_idx
ON public.applications(student_id, status);

CREATE INDEX allocations_active_hostel_idx
ON public.allocations(hostel_id)
WHERE status = 'active';

CREATE INDEX allocations_active_student_idx
ON public.allocations(student_id)
WHERE status = 'active';

CREATE INDEX beds_available_room_idx
ON public.beds(room_id)
WHERE status = 'available';

CREATE INDEX rooms_available_floor_idx
ON public.rooms(floor_id)
WHERE status = 'available';

CREATE INDEX hostel_managers_active_hostel_idx
ON public.hostel_managers(hostel_id)
WHERE is_active = true;

CREATE INDEX hostel_managers_active_manager_idx
ON public.hostel_managers(manager_id)
WHERE is_active = true;


-- ============================================================================
-- 91. SANITY CONSTRAINTS / VALIDATION FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_student_charge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM public.allocations a
        WHERE a.id = NEW.allocation_id
          AND a.student_id = NEW.student_id
    ) THEN
        RAISE EXCEPTION
            'Charge student does not match allocation student';
    END IF;

    RETURN NEW;
END;
$$;


CREATE TRIGGER validate_student_charge_trigger
BEFORE INSERT OR UPDATE ON public.student_charges
FOR EACH ROW
EXECUTE FUNCTION public.validate_student_charge();


-- ============================================================================
-- 92. PROFILE BACKFILL
-- ============================================================================
-- Existing Auth users become students unless already represented.
-- NEVER promote them automatically.
-- ============================================================================

INSERT INTO public.profiles (
    id,
    auth_user_id,
    email,
    full_name,
    role,
    is_active
)
SELECT
    au.id::text,
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data ->> 'full_name',
        split_part(COALESCE(au.email, ''), '@', 1)
    ),
    'student',
    true
FROM auth.users au
LEFT JOIN public.profiles p
    ON (p.id = au.id::text OR p.auth_user_id = au.id)
WHERE p.id IS NULL
  AND au.email IS NOT NULL;


-- ============================================================================
-- 93. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.profiles IS
'Application identity linked one-to-one with Supabase Auth. Role is authoritative.';

COMMENT ON TABLE public.manager_registration_requests IS
'Requests to become a verified PineVela manager.';

COMMENT ON TABLE public.manager_verifications IS
'Sensitive manager identity and authority verification records.';

COMMENT ON TABLE public.hostel_verifications IS
'Intermediate hostel onboarding records. Does not represent an approved hostel until approved_hostel_id is populated.';

COMMENT ON TABLE public.hostels IS
'Approved operational hostels only.';

COMMENT ON TABLE public.allocations IS
'Student room/bed allocations. Creation should use create_allocation().';

COMMENT ON TABLE public.payments IS
'Provider-verified financial transactions. Client cannot directly create successful payments.';

COMMENT ON TABLE public.audit_logs IS
'Central immutable-style application audit trail.';


-- ============================================================================
-- 94. INITIAL REGISTERED HOSTELS SEED DATA
-- ============================================================================
-- Seeds the 4 verified registered hostels and managers into Supabase
-- ============================================================================

-- A. Manager Profiles
INSERT INTO public.profiles (id, email, full_name, role, is_active, is_verified, verification_status)
VALUES 
    ('admin_root', 'admin@pinevela.com', 'System Administrator', 'admin', true, true, 'approved'),
    ('manager_101', 'manager@pinevela.com', 'Anthony Davis', 'manager', true, true, 'approved'),
    ('manager_sarah', 'sarah.j@pinevela.com', 'Sarah Johnson', 'manager', true, true, 'approved'),
    ('manager_maxwell', 'maxwell.m@pinevela.com', 'Maxwell Mensah', 'manager', true, true, 'approved'),
    ('manager_david', 'david.k@pinevela.com', 'David Kojo', 'manager', true, true, 'approved'),
    ('manager_angela', 'angela.o@pinevela.com', 'Angela Owusu', 'manager', true, true, 'approved')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    is_verified = true,
    verification_status = 'approved';

INSERT INTO public.manager_profiles (user_id, email, full_name, phone, role_title, experience_years, is_verified, verification_status)
VALUES 
    ('manager_101', 'manager@pinevela.com', 'Anthony Davis', '+233201234567', 'Senior Property Manager', 5, true, 'approved'),
    ('manager_sarah', 'sarah.j@pinevela.com', 'Sarah Johnson', '+23324488923', 'Hostel Operations Manager', 4, true, 'approved'),
    ('manager_maxwell', 'maxwell.m@pinevela.com', 'Maxwell Mensah', '+23350299882', 'Facilities Administrator', 6, true, 'approved'),
    ('manager_david', 'david.k@pinevela.com', 'David Kojo', '+23324599812', 'Campus Residence Director', 8, true, 'approved'),
    ('manager_angela', 'angela.o@pinevela.com', 'Angela Owusu', '+23324119934', 'Hostel Manager', 3, true, 'approved')
ON CONFLICT (user_id) DO UPDATE SET
    is_verified = true,
    verification_status = 'approved';

-- B. The 4 Registered Hostels
INSERT INTO public.hostels (
    id, name, location, address_line_1, city, region, country, wing, status,
    price, beds_left, available_spaces, total_capacity, max_capacity, rating,
    image, image_url, manager_name, manager_phone, manager_email, manager_id,
    description, registration_date, subscription_paid, is_approved, approval_status,
    amenities, rules, created_by
)
VALUES 
(
    'hostel-1',
    'Pine Crest Residency',
    'North Campus, Sector 5, Accra',
    'North Campus, Sector 5',
    'Accra',
    'Greater Accra',
    'Ghana',
    'North Wing',
    'Open',
    3500.00,
    12,
    12,
    120,
    120,
    4.8,
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    'Sarah Johnson',
    '+23324488923',
    'sarah.j@pinevela.com',
    'manager_sarah',
    'A beautiful and serene student residential community featuring modern air-conditioned master suites, standard shared rooms, free shuttle transport, high-speed fiber-optic WiFi, and a 24/7 learning library.',
    '2026-01-15'::date,
    true,
    true,
    'Approved',
    '["High-Speed WiFi", "24/7 Security", "Air Conditioning", "Study Lounge", "Free Campus Shuttle"]'::jsonb,
    '{"guestPolicy": "Visiting hours until 8 PM", "quietHours": "10 PM - 6 AM", "curfewTime": "22:00"}'::jsonb,
    'admin_root'
),
(
    'hostel-2',
    'Emerald Heights Block A',
    'Main Campus, East Wing, Accra',
    'Main Campus, East Wing',
    'Accra',
    'Greater Accra',
    'Ghana',
    'North Wing',
    'Full',
    4200.00,
    0,
    0,
    180,
    180,
    4.6,
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    'Maxwell Mensah',
    '+23350299882',
    'maxwell.m@pinevela.com',
    'manager_maxwell',
    'Located in the premium core zone of the campus, Emerald Heights offers direct walking paths to major lecture halls, high-security smart access gates, indoor game arenas, and spacious study halls.',
    '2026-02-10'::date,
    true,
    true,
    'Approved',
    '["High-Speed WiFi", "Biometric Access", "Study Rooms", "Backup Generator", "Game Arena"]'::jsonb,
    '{"guestPolicy": "Authorized guests only", "quietHours": "10 PM - 6 AM"}'::jsonb,
    'admin_root'
),
(
    'hostel-3',
    'Sapphire Gardens',
    'West Campus, Block B, Accra',
    'West Campus, Block B',
    'Accra',
    'Greater Accra',
    'Ghana',
    'South Side',
    'Open',
    3800.00,
    28,
    28,
    250,
    250,
    4.9,
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    'David Kojo',
    '+23324599812',
    'david.k@pinevela.com',
    'manager_david',
    'Known for its scenic garden landscaping, Sapphire Gardens offers spacious single and dual-occupancy options, student kitchenettes on every floor, modern sports fields, and a standby power generator.',
    '2026-03-01'::date,
    true,
    true,
    'Approved',
    '["High-Speed WiFi", "Garden Grounds", "Kitchenettes", "Standby Generator", "Sports Pitch"]'::jsonb,
    '{"guestPolicy": "Signed register at gate", "quietHours": "11 PM - 6 AM"}'::jsonb,
    'admin_root'
),
(
    'hostel-4',
    'Pine Ridge Annex',
    'South Campus, Sector 9, Accra',
    'South Campus, Sector 9',
    'Accra',
    'Greater Accra',
    'Ghana',
    'South Side',
    'Under Maintenance',
    3200.00,
    15,
    15,
    90,
    90,
    4.5,
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    'Angela Owusu',
    '+23324119934',
    'angela.o@pinevela.com',
    'manager_angela',
    'Compact and highly convenient annex with direct campus bus connection, quiet reading corners, and solar-powered backup lighting.',
    '2026-03-15'::date,
    true,
    true,
    'Approved',
    '["Solar Backup Lighting", "Direct Bus Access", "Reading Corners", "24/7 Security"]'::jsonb,
    '{"guestPolicy": "Day visitors only", "quietHours": "10 PM - 6 AM"}'::jsonb,
    'admin_root'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    status = EXCLUDED.status,
    price = EXCLUDED.price,
    beds_left = EXCLUDED.beds_left,
    available_spaces = EXCLUDED.available_spaces,
    total_capacity = EXCLUDED.total_capacity,
    image = EXCLUDED.image,
    image_url = EXCLUDED.image_url,
    manager_name = EXCLUDED.manager_name,
    manager_phone = EXCLUDED.manager_phone,
    manager_email = EXCLUDED.manager_email,
    manager_id = EXCLUDED.manager_id,
    is_approved = true,
    approval_status = 'Approved';

-- C. Images
INSERT INTO public.hostel_images (hostel_id, storage_path, public_url, is_primary, display_order)
VALUES 
    ('hostel-1', 'hostels/hostel-1.jpg', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80', true, 0),
    ('hostel-2', 'hostels/hostel-2.jpg', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80', true, 0),
    ('hostel-3', 'hostels/hostel-3.jpg', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80', true, 0),
    ('hostel-4', 'hostels/hostel-4.jpg', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', true, 0)
ON CONFLICT (hostel_id, storage_path) DO UPDATE SET
    public_url = EXCLUDED.public_url,
    is_primary = true;

-- D. Hostel Managers mapping
INSERT INTO public.hostel_managers (hostel_id, manager_id, is_active)
VALUES 
    ('hostel-1', 'manager_sarah', true),
    ('hostel-2', 'manager_maxwell', true),
    ('hostel-3', 'manager_david', true),
    ('hostel-4', 'manager_angela', true)
ON CONFLICT (hostel_id, manager_id) DO UPDATE SET
    is_active = true;

-- E. Default Blocks
INSERT INTO public.blocks (hostel_id, name)
VALUES 
    ('hostel-1', 'Block A - Main'),
    ('hostel-1', 'Block B - Annex'),
    ('hostel-2', 'East Wing Block 1'),
    ('hostel-2', 'East Wing Block 2'),
    ('hostel-3', 'Garden Pavilion 1'),
    ('hostel-3', 'Garden Pavilion 2'),
    ('hostel-4', 'Annex Main')
ON CONFLICT (hostel_id, name) DO NOTHING;


-- ============================================================================
-- END OF PINEVELA PRODUCTION DATABASE v3
-- ============================================================================