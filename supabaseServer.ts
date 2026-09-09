import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

let supabaseClient: SupabaseClient | null = null;
let isConfigured = false;

// Helper to generate standard UUID format required by PostgreSQL UUID columns
export function generateUUID(): string {
  return crypto.randomUUID();
}

export function getSupabase(): { client: SupabaseClient | null; configured: boolean } {
  if (!supabaseClient) {
    const rawUrl = process.env.SUPABASE_URL || "https://mwpssbvbjnhrpxpgcyuk.supabase.co";
    let url = rawUrl.trim();
    if (url.includes("=")) {
      url = url.split("=").pop()!.trim();
    }
    url = url.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
    const key = process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.trim() : "";
    if (url && key && url.startsWith("https://")) {
      try {
        supabaseClient = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        isConfigured = true;
        console.log(`[PineVela] Supabase client securely connected via TLS to: ${url}`);
      } catch (err) {
        console.warn("[PineVela] Supabase initialization failed, running in local persistent fallback mode:", err);
        supabaseClient = null;
        isConfigured = false;
      }
    }
  }
  return { client: supabaseClient, configured: isConfigured };
}

// 1. Users / Profiles
export async function dbGetUsers(fallbackUsers: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      // Check v2 profiles table first
      const { data: profileData, error: profileErr } = await client.from("profiles").select("*");
      if (!profileErr && profileData && profileData.length > 0) {
        return profileData.map((p) => {
          const userToken = `token_${p.id}`;
          const userObj = {
            id: p.id,
            name: p.full_name,
            role: p.role,
            token: userToken,
            email: p.email,
            phone: p.phone,
            avatar: p.avatar_url,
            nationalId: p.national_id || '',
            organization: p.organization || '',
            roleTitle: p.role_title || '',
            experienceYears: p.experience_years || 1,
            address: p.address || '',
            isVerified: p.is_verified ?? false,
            verificationStatus: p.verification_status || 'pending'
          };
          return {
            id: p.id,
            email: p.email,
            username: p.username || p.email,
            name: p.full_name,
            role: p.role,
            phone: p.phone,
            avatar: p.avatar_url,
            bio: p.bio,
            token: userToken,
            user: userObj,
            nationalId: p.national_id || '',
            organization: p.organization || '',
            roleTitle: p.role_title || '',
            experienceYears: p.experience_years || 1,
            address: p.address || '',
            isVerified: p.is_verified ?? false,
            verificationStatus: p.verification_status || 'pending',
            created_at: p.created_at
          };
        });
      }

      // Fallback to prototype users table
      const { data, error } = await client.from("users").select("*");
      if (!error && data && data.length > 0) {
        return data.map((u: any) => ({
          ...u,
          token: u.token || `token_${u.id}`,
          user: u.user || {
            id: u.id,
            name: u.name || u.full_name || 'User',
            role: u.role || 'student',
            token: u.token || `token_${u.id}`,
            email: u.email
          }
        }));
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetUsers:", err);
    }
  }
  return fallbackUsers;
}

export async function dbGetUserByEmailOrUsername(usernameOrEmail: string, fallbackUsers: any[]): Promise<any | null> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      // Check profiles table first
      const { data: profileData, error: profileErr } = await client
        .from("profiles")
        .select("*")
        .or(`email.eq.${usernameOrEmail},username.eq.${usernameOrEmail}`)
        .maybeSingle();

      if (!profileErr && profileData) {
        let managerExtra: any = {};
        if (profileData.role === 'manager') {
          try {
            const { data: mgrData } = await client
              .from("manager_profiles")
              .select("*")
              .or(`user_id.eq.${profileData.id},email.eq.${profileData.email}`)
              .maybeSingle();
            if (mgrData) {
              managerExtra = {
                nationalId: mgrData.national_id,
                organization: mgrData.organization,
                roleTitle: mgrData.role_title,
                experienceYears: mgrData.experience_years,
                address: mgrData.operating_address,
                isVerified: mgrData.is_verified,
                verificationStatus: mgrData.verification_status
              };
            }
          } catch (mgrErr) {
            // non-fatal
          }
        }

        return {
          email: profileData.email,
          username: profileData.username || profileData.email,
          password: 'Password123!', // managed by Supabase Auth in production
          user: {
            id: profileData.id,
            name: profileData.full_name,
            role: profileData.role,
            token: `token_${profileData.id}`,
            email: profileData.email,
            phone: profileData.phone,
            avatar: profileData.avatar_url,
            nationalId: profileData.national_id || managerExtra.nationalId || '',
            organization: profileData.organization || managerExtra.organization || '',
            roleTitle: profileData.role_title || managerExtra.roleTitle || 'Hostel Manager',
            experienceYears: profileData.experience_years || managerExtra.experienceYears || 1,
            address: profileData.address || managerExtra.address || '',
            isVerified: profileData.is_verified ?? managerExtra.isVerified ?? false,
            verificationStatus: profileData.verification_status || managerExtra.verificationStatus || 'pending'
          }
        };
      }

      // Fallback to legacy users table
      const { data, error } = await client
        .from("users")
        .select("*")
        .or(`email.eq.${usernameOrEmail},username.eq.${usernameOrEmail}`)
        .maybeSingle();

      if (!error && data) {
        return {
          email: data.email,
          username: data.username,
          password: data.password,
          user: {
            id: data.id,
            name: data.name,
            role: data.role,
            token: data.token || `token_${data.id}`,
            email: data.email,
            phone: data.phone,
            nationalId: data.national_id || data.nationalId || '',
            organization: data.organization || '',
            roleTitle: data.role_title || data.roleTitle || 'Hostel Manager',
            experienceYears: data.experience_years || data.experienceYears || 1,
            address: data.address || '',
            isVerified: data.is_verified ?? false
          }
        };
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetUserByEmailOrUsername:", err);
    }
  }
  return fallbackUsers.find(
    (u) => u.email === usernameOrEmail || u.username === usernameOrEmail
  ) || null;
}

// 2. Hostels
export async function dbCleanupPlaceholderHostels(fallbackHostels?: any[]): Promise<void> {
  // Safe cleanup: only remove items explicitly flagged as temporary test placeholders
  if (fallbackHostels) {
    for (let i = fallbackHostels.length - 1; i >= 0; i--) {
      if (fallbackHostels[i]?.isTestPlaceholder === true) {
        fallbackHostels.splice(i, 1);
      }
    }
  }
}

export async function dbGetHostels(fallbackHostels: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      // 1. Fetch hostels from Supabase
      const { data, error } = await client.from("hostels").select("*").order("created_at", { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        // Fetch related images and blocks if present in v2 schema
        try {
          const { data: imgData } = await client.from("hostel_images").select("*");
          const { data: blockData } = await client.from("blocks").select("*");
          const { data: managerData } = await client.from("hostel_managers").select("*, profiles(*)");

          return data.map(h => {
            const primaryImg = imgData?.find(img => img.hostel_id === h.id && img.is_primary)?.public_url 
              || imgData?.find(img => img.hostel_id === h.id)?.public_url;
            const hostelBlocks = blockData?.filter(b => b.hostel_id === h.id) || [];
            const mgr = managerData?.find(m => m.hostel_id === h.id && m.is_active)?.profiles;

            const locStr = h.location || [h.address_line_1, h.city, h.region, h.country].filter(Boolean).join(', ') || 'Ghana';

            return {
              ...h,
              location: locStr,
              wing: h.wing || 'North Wing',
              status: h.status === 'active' ? 'Open' : (h.status === 'under_maintenance' ? 'Under Maintenance' : (h.status || 'Open')),
              bedsLeft: h.beds_left ?? h.bedsLeft ?? h.available_spaces ?? h.availableSpaces ?? h.max_capacity ?? 50,
              totalCapacity: h.total_capacity ?? h.totalCapacity ?? h.max_capacity ?? 50,
              availableSpaces: h.available_spaces ?? h.availableSpaces ?? h.beds_left ?? h.bedsLeft ?? h.max_capacity ?? 50,
              price: Number(h.price || h.pricing?.defaultFee || h.defaultFee || 3500),
              image: h.image || primaryImg || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
              imageUrl: h.image_url || h.imageUrl || h.image || primaryImg || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
              managerName: h.manager_name || h.managerName || mgr?.full_name || 'Resident Manager',
              managerPhone: h.manager_phone || h.managerPhone || h.contact_phone || '+233201234567',
              managerEmail: h.manager_email || h.managerEmail || h.contact_email || '',
              managerId: h.manager_id || h.managerId || mgr?.id,
              rating: Number(h.rating) || 4.8,
              blocks: h.blocks && h.blocks.length ? h.blocks : hostelBlocks,
              amenities: h.amenities || ["High-Speed WiFi", "24/7 Security", "Air Conditioning", "Study Lounge"],
              isApproved: h.is_approved ?? h.isApproved ?? (h.approval_status === 'Approved' || h.approvalStatus === 'Approved')
            };
          });
        } catch {
          return data;
        }
      } else if (!error && Array.isArray(data) && data.length === 0 && fallbackHostels.length > 0) {
        console.log("[PineVela] Supabase hostels table is empty. Syncing registered hostels to Supabase...");
        for (const h of fallbackHostels) {
          try {
            await dbCreateHostel(h, fallbackHostels);
          } catch (syncErr) {
            console.warn("Notice syncing hostel to Supabase:", syncErr);
          }
        }
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetHostels, using local store:", err);
    }
  }

  // Return normalized persistent hostels from local store
  return fallbackHostels.map(h => ({
    ...h,
    status: h.status === 'active' ? 'Open' : (h.status === 'under_maintenance' ? 'Under Maintenance' : (h.status || 'Open')),
    bedsLeft: Number(h.bedsLeft ?? h.availableSpaces ?? h.totalCapacity ?? 50),
    totalCapacity: Number(h.totalCapacity ?? h.bedsLeft ?? 50),
    availableSpaces: Number(h.availableSpaces ?? h.bedsLeft ?? 50),
    price: Number(h.price || h.pricing?.defaultFee || h.defaultFee || 3500),
    managerName: h.managerName || 'Resident Manager',
    managerPhone: h.managerPhone || '+233201234567',
    image: h.image || h.imageUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    imageUrl: h.imageUrl || h.image || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    wing: h.wing || 'North Wing',
    isApproved: h.isApproved ?? (h.approvalStatus === 'Approved' || !h.approvalStatus)
  }));
}

export async function dbCreateHostel(newHostel: any, fallbackHostels: any[]): Promise<any> {
  const existingIndex = fallbackHostels.findIndex(h => h.id === newHostel.id);
  if (existingIndex !== -1) {
    fallbackHostels[existingIndex] = { ...fallbackHostels[existingIndex], ...newHostel };
  } else {
    fallbackHostels.unshift(newHostel);
  }
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const v2HostelRow: any = {
        id: newHostel.id ? String(newHostel.id) : generateUUID(),
        name: newHostel.name,
        description: newHostel.description || '',
        hostel_type: newHostel.hostel_type || 'student_accommodation',
        gender: (newHostel.gender || 'mixed').toLowerCase() === 'female' ? 'female' : (newHostel.gender || 'mixed').toLowerCase() === 'male' ? 'male' : 'mixed',
        status: newHostel.status || 'Open',
        year_established: newHostel.year_established || new Date().getFullYear(),
        contact_email: newHostel.contact_email || newHostel.managerEmail || '',
        contact_phone: newHostel.contact_phone || newHostel.managerPhone || '',
        alternative_phone: newHostel.alternative_phone || '',
        website: newHostel.website || '',
        location: newHostel.location || 'Campus Road',
        address_line_1: newHostel.address_line_1 || newHostel.location || 'Campus Road',
        address_line_2: newHostel.address_line_2 || '',
        city: newHostel.city || 'Accra',
        region: newHostel.region || 'Greater Accra',
        district: newHostel.district || '',
        country: newHostel.country || 'Ghana',
        postal_code: newHostel.postal_code || '',
        digital_address: newHostel.digital_address || '',
        landmark: newHostel.landmark || '',
        latitude: newHostel.latitude ? Number(newHostel.latitude) : null,
        longitude: newHostel.longitude ? Number(newHostel.longitude) : null,
        wing: newHostel.wing || 'North Wing',
        price: Number(newHostel.price || newHostel.pricing?.defaultFee || 3500),
        image: newHostel.image || newHostel.imageUrl || '',
        image_url: newHostel.imageUrl || newHostel.image || '',
        manager_name: newHostel.managerName || '',
        manager_phone: newHostel.managerPhone || '',
        manager_email: newHostel.managerEmail || '',
        manager_id: newHostel.managerId || null,
        beds_left: Number(newHostel.bedsLeft ?? newHostel.availableSpaces ?? newHostel.totalCapacity ?? 50),
        available_spaces: Number(newHostel.availableSpaces ?? newHostel.bedsLeft ?? newHostel.totalCapacity ?? 50),
        total_capacity: Number(newHostel.totalCapacity || newHostel.max_capacity || 100),
        max_capacity: Number(newHostel.max_capacity || newHostel.totalCapacity || 100),
        rating: Number(newHostel.rating || 4.8),
        registration_date: newHostel.registrationDate || new Date().toISOString().split('T')[0],
        subscription_paid: newHostel.subscriptionPaid ?? true,
        is_approved: newHostel.isApproved ?? (newHostel.approvalStatus === 'Approved'),
        approval_status: newHostel.approvalStatus || (newHostel.isApproved ? 'Approved' : 'Pending Approval'),
        amenities: newHostel.amenities || [],
        rules: newHostel.rules || {},
        pricing: newHostel.pricing || {},
        blocks: newHostel.blocks || [],
        created_by: newHostel.created_by || newHostel.managerId || null
      };

      const { data: upsertData, error: upsertErr } = await client.from("hostels").upsert([v2HostelRow], { onConflict: 'id' }).select().maybeSingle();
      if (upsertErr) {
        console.warn("Supabase hostel upsert notice:", upsertErr.message);
      } else if (upsertData) {
        return { ...newHostel, id: upsertData.id };
      }
    } catch (err) {
      console.warn("Supabase insert error in dbCreateHostel:", err);
    }
  }
  return newHostel;
}

export async function dbRegisterHostelAtomic(
  registrationPayload: any,
  fallbackHostels: any[],
  adminUserId?: string
): Promise<{ success: boolean; hostel: any; message?: string }> {
  // 1. Duplicate check (prevent double submit within last 30 seconds)
  const recentExisting = fallbackHostels.find(h => 
    (h?.name || '').toLowerCase().trim() === (registrationPayload?.name || '').toLowerCase().trim()
  );
  if (recentExisting) {
    const existingDate = new Date(recentExisting.created_at || Date.now()).getTime();
    if (Date.now() - existingDate < 30000) {
      return {
        success: true,
        hostel: recentExisting,
        message: "Hostel registration was already completed."
      };
    }
  }

  // 2. Clean up any placeholder demo hostels from DB
  await dbCleanupPlaceholderHostels(fallbackHostels);

  const hostelId = registrationPayload.id 
    ? String(registrationPayload.id) 
    : generateUUID();

  const totalCapacity = Number(registrationPayload.capacity || registrationPayload.totalCapacity || registrationPayload.totalBeds || 100);
  const locationString = registrationPayload.location || [
    registrationPayload.addressLine1,
    registrationPayload.city,
    registrationPayload.region,
    registrationPayload.country
  ].filter(Boolean).join(', ') || 'Accra, Ghana';

  const defaultPrice = Number(registrationPayload.price || registrationPayload.pricing?.defaultFee || registrationPayload.defaultFee || 3500);
  const newHostel: any = {
    id: hostelId,
    name: registrationPayload.name.trim(),
    location: locationString,
    wing: registrationPayload.wing || 'North Wing',
    status: 'Open',
    bedsLeft: totalCapacity,
    totalCapacity: totalCapacity,
    availableSpaces: totalCapacity,
    price: defaultPrice,
    pricing: registrationPayload.pricing || { defaultFee: defaultPrice, currency: registrationPayload.currency || 'GHS' },
    image: registrationPayload.imageUrl || registrationPayload.image || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    imageUrl: registrationPayload.imageUrl || registrationPayload.image || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    managerName: registrationPayload.managerName || 'Resident Manager',
    managerPhone: registrationPayload.managerPhone || registrationPayload.contactPhone || '+233201234567',
    managerEmail: registrationPayload.managerEmail || registrationPayload.contactEmail || '',
    managerId: registrationPayload.assignedManagerId || registrationPayload.managerId || null,
    description: registrationPayload.description || 'Modern student accommodation community.',
    rating: 5.0,
    registrationDate: new Date().toISOString().split('T')[0],
    subscriptionPaid: true,
    isApproved: true,
    approvalStatus: 'Approved',
    blocks: registrationPayload.blocks || registrationPayload.blocksList || [],
    amenities: registrationPayload.facilities || ["High-Speed WiFi", "24/7 Security", "Air Conditioning", "Study Lounge"],
    // V2 Schema Fields
    hostel_type: registrationPayload.hostelType || 'student_accommodation',
    gender: (registrationPayload.genderCategory || 'mixed').toLowerCase() === 'female' ? 'female' : (registrationPayload.genderCategory || 'mixed').toLowerCase() === 'male' ? 'male' : 'mixed',
    year_established: registrationPayload.yearEstablished ? Number(registrationPayload.yearEstablished) : new Date().getFullYear(),
    contact_email: registrationPayload.contactEmail || registrationPayload.managerEmail || '',
    contact_phone: registrationPayload.contactPhone || registrationPayload.managerPhone || '',
    alternative_phone: registrationPayload.alternativePhone || '',
    website: registrationPayload.website || '',
    address_line_1: registrationPayload.addressLine1 || registrationPayload.location || 'Campus Entrance',
    address_line_2: registrationPayload.addressLine2 || '',
    city: registrationPayload.city || 'Accra',
    region: registrationPayload.region || 'Greater Accra',
    district: registrationPayload.district || '',
    country: registrationPayload.country || 'Ghana',
    postal_code: registrationPayload.postalCode || '',
    digital_address: registrationPayload.digitalAddress || '',
    landmark: registrationPayload.landmark || '',
    latitude: registrationPayload.latitude ? Number(registrationPayload.latitude) : null,
    longitude: registrationPayload.longitude ? Number(registrationPayload.longitude) : null,
    max_capacity: totalCapacity,
    created_by: adminUserId ? String(adminUserId) : (registrationPayload.managerId || generateUUID()),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 3. Save hostel record
  const savedHostel = await dbCreateHostel(newHostel, fallbackHostels);
  const { client, configured } = getSupabase();

  if (configured && client) {
    const finalHostelId = savedHostel.id || hostelId;

    // 4. Save primary image to hostel_images table
    if (newHostel.image) {
      try {
        await client.from("hostel_images").insert([{
          id: generateUUID(),
          hostel_id: finalHostelId,
          storage_path: registrationPayload.imagePath || `hostels/${finalHostelId}.jpg`,
          public_url: newHostel.image,
          is_primary: true,
          display_order: 0
        }]);
      } catch (imgErr) {
        console.warn("Notice inserting hostel_images:", imgErr);
      }
    }

    // 5. Save policies to hostel_policies table
    if (registrationPayload.rules || registrationPayload.policies) {
      try {
        await client.from("hostel_policies").insert([{
          id: generateUUID(),
          hostel_id: finalHostelId,
          guest_policy: registrationPayload.rules?.guestPolicy || 'Visiting hours apply',
          curfew_policy: registrationPayload.rules?.curfewTime || '22:00:00',
          smoking_policy: Boolean(registrationPayload.rules?.smokingAllowed) ? 'Allowed in designated areas' : 'Strictly non-smoking',
          pets_policy: Boolean(registrationPayload.rules?.petsAllowed) ? 'Pets permitted with prior notice' : 'No pets allowed',
          noise_policy: registrationPayload.rules?.quietHours || 'Quiet hours 10PM - 6AM',
          cancellation_policy: 'Standard academic semester policy'
        }]);
      } catch (polErr) {
        console.warn("Notice inserting hostel_policies:", polErr);
      }
    }

    // 6. Save blocks and structural hierarchy into blocks table
    if (Array.isArray(registrationPayload.blocksList) && registrationPayload.blocksList.length > 0) {
      for (const [idx, b] of registrationPayload.blocksList.entries()) {
        try {
          const blockId = generateUUID();
          await client.from("blocks").insert([{
            id: blockId,
            hostel_id: finalHostelId,
            name: b.name || `Block ${idx + 1}`
          }]);
        } catch (blockErr) {
          console.warn("Notice inserting blocks:", blockErr);
        }
      }
    }

    // 7. Link assigned manager in hostel_managers table
    if (registrationPayload.assignedManagerId || registrationPayload.managerId) {
      const mgrId = String(registrationPayload.assignedManagerId || registrationPayload.managerId);
      try {
        await client.from("hostel_managers").insert([{
          id: generateUUID(),
          hostel_id: finalHostelId,
          manager_id: mgrId,
          is_active: true
        }]);
      } catch (mgrErr) {
        console.warn("Notice inserting hostel_managers:", mgrErr);
      }
    }
  }

  return {
    success: true,
    hostel: savedHostel
  };
}

export async function dbUpdateHostel(id: string, updateData: any, fallbackHostels: any[]): Promise<any> {
  const idx = fallbackHostels.findIndex((h) => h.id === id);
  if (idx !== -1) {
    fallbackHostels[idx] = { ...fallbackHostels[idx], ...updateData };
  }
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const snakeCaseUpdate: any = {};
      for (const [k, v] of Object.entries(updateData)) {
        if (k === 'isApproved') snakeCaseUpdate.is_approved = v;
        else if (k === 'approvalStatus') snakeCaseUpdate.approval_status = v;
        else if (k === 'managerId') snakeCaseUpdate.manager_id = v;
        else if (k === 'managerName') snakeCaseUpdate.manager_name = v;
        else if (k === 'managerPhone') snakeCaseUpdate.manager_phone = v;
        else if (k === 'managerEmail') snakeCaseUpdate.manager_email = v;
        else if (k === 'bedsLeft') snakeCaseUpdate.beds_left = v;
        else if (k === 'totalCapacity') snakeCaseUpdate.total_capacity = v;
        else if (k === 'availableSpaces') snakeCaseUpdate.available_spaces = v;
        else if (k === 'imageUrl') snakeCaseUpdate.image_url = v;
        else if (k === 'registrationDate') snakeCaseUpdate.registration_date = v;
        else if (k === 'subscriptionPaid') snakeCaseUpdate.subscription_paid = v;
        else snakeCaseUpdate[k] = v;
      }
      await client.from("hostels").update(snakeCaseUpdate).eq("id", id);
    } catch (err) {
      console.warn("Supabase update error in dbUpdateHostel:", err);
    }
  }
  return idx !== -1 ? fallbackHostels[idx] : updateData;
}

// 3. Applications / Booking Requests
export async function dbGetBookingRequests(fallbackRequests: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      // Check applications table (v2)
      const { data: appsData, error: appsErr } = await client
        .from("applications")
        .select("*, profiles(*), hostels(*)")
        .order("submitted_at", { ascending: false });

      if (!appsErr && appsData && appsData.length > 0) {
        return appsData.map(a => ({
          id: a.id,
          studentName: a.profiles?.full_name || 'Registered Student',
          studentId: a.student_id,
          roomType: a.preferred_room_type || 'Standard Room',
          hostelName: a.hostels?.name || 'Selected Hostel',
          avatar: a.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          status: a.status === 'approved' ? 'Approved' : (a.status === 'rejected' ? 'Ignored' : 'Pending'),
          created_at: a.submitted_at
        }));
      }

      // Fallback to prototype booking_requests
      const { data, error } = await client.from("booking_requests").select("*");
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetBookingRequests:", err);
    }
  }
  return fallbackRequests;
}

export async function dbCreateBookingRequest(newRequest: any, fallbackRequests: any[]): Promise<any> {
  fallbackRequests.unshift(newRequest);
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("booking_requests").insert([newRequest]);
    } catch (err) {
      console.warn("Supabase insert error in dbCreateBookingRequest:", err);
    }
  }
  return newRequest;
}

export async function dbUpdateBookingRequest(id: string, status: string, fallbackRequests: any[]): Promise<any> {
  const idx = fallbackRequests.findIndex((r) => r.id === id);
  if (idx !== -1) {
    fallbackRequests[idx] = { ...fallbackRequests[idx], status };
  }
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("booking_requests").update({ status }).eq("id", id);
      // Also update v2 applications table if applicable
      const lowerStatus = (status || '').toLowerCase();
      const v2Status = lowerStatus === 'approved' ? 'approved' : (lowerStatus === 'ignored' || lowerStatus === 'rejected' ? 'rejected' : 'pending');
      await client.from("applications").update({ status: v2Status, reviewed_at: new Date().toISOString() }).eq("id", id);
    } catch (err) {
      console.warn("Supabase update error in dbUpdateBookingRequest:", err);
    }
  }
  return idx !== -1 ? fallbackRequests[idx] : { id, status };
}

// 4. Maintenance Requests / Complaints / Issue Reports
export async function dbGetIssueReports(fallbackReports: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      // Check v2 maintenance_requests table
      const { data: maintData, error: maintErr } = await client
        .from("maintenance_requests")
        .select("*, profiles(*), hostels(*)")
        .order("created_at", { ascending: false });

      if (!maintErr && maintData && maintData.length > 0) {
        return maintData.map(m => ({
          id: m.id,
          title: m.title,
          category: m.category,
          urgency: m.priority === 'urgent' || m.priority === 'high' ? 'High' : (m.priority === 'low' ? 'Low' : 'Medium'),
          description: m.description,
          photos: m.photos || [],
          contactMethod: 'In-app Notification',
          studentName: m.profiles?.full_name || 'Resident',
          studentId: m.student_id,
          status: m.status === 'resolved' ? 'Resolved' : (m.status === 'in_progress' ? 'In Progress' : 'Pending'),
          created_at: m.created_at
        }));
      }

      // Fallback to legacy issue_reports
      const { data, error } = await client.from("issue_reports").select("*");
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetIssueReports:", err);
    }
  }
  return fallbackReports;
}

export async function dbCreateIssueReport(newIssue: any, fallbackReports: any[]): Promise<any> {
  fallbackReports.unshift(newIssue);
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("issue_reports").insert([newIssue]);
    } catch (err) {
      console.warn("Supabase insert error in dbCreateIssueReport:", err);
    }
  }
  return newIssue;
}

export async function dbUpdateIssueReport(id: string, updateData: any, fallbackReports: any[]): Promise<any> {
  const idx = fallbackReports.findIndex((r) => r.id === id);
  if (idx !== -1) {
    const cleanUpdates: any = {};
    for (const key of Object.keys(updateData)) {
      if (updateData[key] !== undefined) {
        cleanUpdates[key] = updateData[key];
      }
    }
    fallbackReports[idx] = { ...fallbackReports[idx], ...cleanUpdates };
  }
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("issue_reports").update(updateData).eq("id", id);
    } catch (err) {
      console.warn("Supabase update error in dbUpdateIssueReport:", err);
    }
  }
  return idx !== -1 ? fallbackReports[idx] : null;
}

// 5. Staff Profiles
export async function dbGetStaff(fallbackStaff: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      // Check v2 staff_profiles table
      const { data: staffData, error: staffErr } = await client
        .from("staff_profiles")
        .select("*, profiles(*)")
        .eq("active", true);

      if (!staffErr && staffData && staffData.length > 0) {
        return staffData.map(s => ({
          id: s.user_id,
          name: s.profiles?.full_name || 'Staff Member',
          role: s.job_title,
          phone: s.profiles?.phone || '+233 24 000 0000',
          contactMethod: 'WhatsApp',
          email: s.profiles?.email
        }));
      }

      // Fallback to legacy staff table
      const { data, error } = await client.from("staff").select("*");
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetStaff:", err);
    }
  }
  return fallbackStaff;
}

export async function dbCreateStaff(newStaff: any, fallbackStaff: any[]): Promise<any> {
  fallbackStaff.push(newStaff);
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("staff").insert([newStaff]);
    } catch (err) {
      console.warn("Supabase insert error in dbCreateStaff:", err);
    }
  }
  return newStaff;
}

export async function dbDeleteStaff(id: string, fallbackStaff: any[]): Promise<boolean> {
  const idx = fallbackStaff.findIndex((s) => s.id === id);
  if (idx !== -1) {
    fallbackStaff.splice(idx, 1);
  }
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("staff").delete().eq("id", id);
      await client.from("staff_profiles").update({ active: false }).eq("user_id", id);
    } catch (err) {
      console.warn("Supabase delete error in dbDeleteStaff:", err);
    }
  }
  return true;
}

// 6. Meetings
export async function dbGetMeetings(fallbackMeetings: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const { data, error } = await client.from("meetings").select("*");
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetMeetings:", err);
    }
  }
  return fallbackMeetings;
}

export async function dbCreateMeeting(newMeeting: any, fallbackMeetings: any[]): Promise<any> {
  fallbackMeetings.unshift(newMeeting);
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("meetings").insert([newMeeting]);
    } catch (err) {
      console.warn("Supabase insert error in dbCreateMeeting:", err);
    }
  }
  return newMeeting;
}

export async function dbUpdateMeeting(id: string, status: string, fallbackMeetings: any[]): Promise<any> {
  const idx = fallbackMeetings.findIndex((m) => m.id === id);
  if (idx !== -1) {
    fallbackMeetings[idx] = { ...fallbackMeetings[idx], status };
  }
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("meetings").update({ status }).eq("id", id);
    } catch (err) {
      console.warn("Supabase update error in dbUpdateMeeting:", err);
    }
  }
  return idx !== -1 ? fallbackMeetings[idx] : { id, status };
}

// 7. Notifications
export async function dbGetNotifications(fallbackNotifications: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const { data, error } = await client.from("notifications").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.is_read ?? n.read ?? false,
          created_at: n.created_at
        }));
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetNotifications:", err);
    }
  }
  return fallbackNotifications;
}

export async function dbCreateNotification(newNotification: any, fallbackNotifications: any[]): Promise<any> {
  fallbackNotifications.unshift(newNotification);
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("notifications").insert([{
        id: generateUUID(),
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type || 'info',
        is_read: false
      }]);
    } catch (err) {
      console.warn("Supabase insert error in dbCreateNotification:", err);
    }
  }
  return newNotification;
}

export async function dbMarkNotificationRead(id: string, fallbackNotifications: any[]): Promise<boolean> {
  const notif = fallbackNotifications.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
  }
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
    } catch (err) {
      console.warn("Supabase update error in dbMarkNotificationRead:", err);
    }
  }
  return true;
}

// 8. Ratings
export async function dbGetRatings(fallbackRatings: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const { data, error } = await client.from("ratings").select("*");
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetRatings:", err);
    }
  }
  return fallbackRatings;
}

export async function dbCreateRating(newRating: any, fallbackRatings: any[]): Promise<any> {
  fallbackRatings.unshift(newRating);
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("ratings").insert([newRating]);
    } catch (err) {
      console.warn("Supabase insert error in dbCreateRating:", err);
    }
  }
  return newRating;
}

// 9. Activities / Audit Logs
export async function dbGetActivities(fallbackActivities: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      // Check v2 audit_logs table
      const { data: auditData, error: auditErr } = await client
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!auditErr && auditData && auditData.length > 0) {
        return auditData.map(a => ({
          id: a.id,
          text: a.action,
          time: 'Recently',
          type: (a.action || '').toLowerCase().includes('error') ? 'warning' : 'success'
        }));
      }

      // Fallback to legacy activities
      const { data, error } = await client.from("activities").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetActivities:", err);
    }
  }
  return fallbackActivities;
}

export async function dbCreateActivity(newActivity: any, fallbackActivities: any[]): Promise<any> {
  fallbackActivities.unshift(newActivity);
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("activities").insert([newActivity]);
      // Also write to audit_logs
      await client.from("audit_logs").insert([{
        id: generateUUID(),
        action: newActivity.text,
        entity_type: 'hostel_system',
        details: { activityType: newActivity.type }
      }]);
    } catch (err) {
      console.warn("Supabase insert error in dbCreateActivity:", err);
    }
  }
  return newActivity;
}

// 10. Chat Profiles & Messages
export async function dbGetChatProfile(studentId: string, fallbackProfiles: any[]): Promise<any | null> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const { data, error } = await client
        .from("chat_profiles")
        .select("*")
        .eq("studentId", studentId)
        .maybeSingle();
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetChatProfile:", err);
    }
  }
  return fallbackProfiles.find((p) => p.studentId === studentId) || null;
}

export async function dbUpdateChatProfile(
  studentId: string,
  nickname: string,
  avatarUrl: string,
  fallbackProfiles: any[]
): Promise<any> {
  const existingIdx = fallbackProfiles.findIndex((p) => p.studentId === studentId);
  const profileData = { studentId, nickname, avatarUrl };
  if (existingIdx !== -1) {
    fallbackProfiles[existingIdx] = { ...fallbackProfiles[existingIdx], ...profileData };
  } else {
    fallbackProfiles.push(profileData);
  }
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("chat_profiles").upsert([profileData], { onConflict: "studentId" });
    } catch (err) {
      console.warn("Supabase upsert error in dbUpdateChatProfile:", err);
    }
  }
  return profileData;
}

export async function dbGetChatMessages(
  channelType: string,
  channelId: string,
  fallbackMessages: any[]
): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const { data, error } = await client
        .from("chat_messages")
        .select("*")
        .eq("channelType", channelType)
        .eq("channelId", channelId)
        .order("createdAt", { ascending: true });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetChatMessages:", err);
    }
  }
  return fallbackMessages.filter(
    (m) => m.channelType === channelType && m.channelId === channelId
  );
}

export async function dbCreateChatMessage(newMsg: any, fallbackMessages: any[]): Promise<any> {
  const existingIdx = fallbackMessages.findIndex((m) => m.id === newMsg.id);
  if (existingIdx !== -1) {
    fallbackMessages[existingIdx] = newMsg;
  } else {
    fallbackMessages.push(newMsg);
  }
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("chat_messages").insert([newMsg]);
    } catch (err) {
      console.warn("Supabase insert error in dbCreateChatMessage:", err);
    }
  }
  return newMsg;
}

export async function dbReactToChatMessage(
  id: string,
  emoji: string,
  reactorName: string,
  fallbackMessages: any[]
): Promise<any | null> {
  const msg = fallbackMessages.find((m) => m.id === id);
  if (!msg) return null;
  if (!msg.reactions) msg.reactions = {};
  if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
  if (!msg.reactions[emoji].includes(reactorName)) {
    msg.reactions[emoji].push(reactorName);
  } else {
    msg.reactions[emoji] = msg.reactions[emoji].filter((n: string) => n !== reactorName);
  }

  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("chat_messages").update({ reactions: msg.reactions }).eq("id", id);
    } catch (err) {
      console.warn("Supabase update error in dbReactToChatMessage:", err);
    }
  }
  return msg;
}

// 12. DM Rooms
export async function dbGetDMRooms(studentId: string, fallbackRooms: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const { data, error } = await client
        .from("dm_rooms")
        .select("*")
        .or(`user1Id.eq.${studentId},user2Id.eq.${studentId}`);
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase query error in dbGetDMRooms:", err);
    }
  }
  return fallbackRooms.filter(
    (r) => r.user1Id === studentId || r.user2Id === studentId
  );
}

export async function dbCreateDMRoom(newRoom: any, fallbackRooms: any[]): Promise<any> {
  fallbackRooms.push(newRoom);
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("dm_rooms").insert([newRoom]);
    } catch (err) {
      console.warn("Supabase insert error in dbCreateDMRoom:", err);
    }
  }
  return newRoom;
}

export async function dbAcceptDMRoom(roomId: string, fallbackRooms: any[]): Promise<any | null> {
  const room = fallbackRooms.find((r) => r.id === roomId);
  if (room) {
    room.status = "accepted";
  }
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("dm_rooms").update({ status: "accepted" }).eq("id", roomId);
    } catch (err) {
      console.warn("Supabase update error in dbAcceptDMRoom:", err);
    }
  }
  return room || null;
}

// 13. Manager Profiles & Registration Persistence
export async function dbSaveManagerProfile(managerData: {
  id?: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  nationalId?: string;
  organization?: string;
  roleTitle?: string;
  experienceYears?: number;
  address?: string;
  password?: string;
}): Promise<boolean> {
  const { client, configured } = getSupabase();
  if (!configured || !client) return false;

  try {
    const cleanEmail = (managerData.email || '').toLowerCase().trim();
    const userId = managerData.userId || managerData.id || generateUUID();
    const validUserId = /^[0-9a-fA-F-]{36}$/.test(userId) ? userId : null;

    // 1. Persist to dedicated manager_profiles table
    try {
      await client.from("manager_profiles").upsert([
        {
          id: generateUUID(),
          user_id: validUserId,
          email: cleanEmail,
          full_name: managerData.name,
          phone: managerData.phone || null,
          national_id: managerData.nationalId || null,
          organization: managerData.organization || 'Independent Accommodation Management',
          role_title: managerData.roleTitle || 'Hostel Manager',
          experience_years: Number(managerData.experienceYears) || 1,
          operating_address: managerData.address || null,
          verification_status: 'pending',
          is_verified: false
        }
      ], { onConflict: 'email' });
    } catch (mgrErr) {
      console.warn("Notice saving to manager_profiles in Supabase:", mgrErr);
    }

    // 2. Persist to public.profiles table
    try {
      await client.from("profiles").upsert([
        {
          id: validUserId || generateUUID(),
          email: cleanEmail,
          full_name: managerData.name,
          role: 'manager',
          phone: managerData.phone || null,
          national_id: managerData.nationalId || null,
          organization: managerData.organization || 'Independent Accommodation Management',
          role_title: managerData.roleTitle || 'Hostel Manager',
          experience_years: Number(managerData.experienceYears) || 1,
          address: managerData.address || null,
          is_verified: false,
          verification_status: 'pending'
        }
      ], { onConflict: 'email' });
    } catch (profErr) {
      console.warn("Notice saving to profiles in Supabase:", profErr);
    }

    // 3. Persist to prototype users table for fallback compatibility
    try {
      await client.from("users").upsert([
        {
          id: userId,
          email: cleanEmail,
          username: cleanEmail.split('@')[0],
          name: managerData.name,
          role: 'manager',
          phone: managerData.phone || '',
          national_id: managerData.nationalId || '',
          organization: managerData.organization || '',
          role_title: managerData.roleTitle || '',
          experience_years: Number(managerData.experienceYears) || 1,
          address: managerData.address || '',
          password: managerData.password || 'manager123'
        }
      ], { onConflict: 'email' });
    } catch (uErr) {
      console.warn("Notice saving to users table in Supabase:", uErr);
    }

    return true;
  } catch (err) {
    console.error("Failed to persist manager profile in Supabase:", err);
    return false;
  }
}

export async function dbGetManagerRequests(fallbackRequests: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const { data, error } = await client
        .from("manager_registration_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((r) => ({
          id: r.id,
          managerId: r.manager_id || r.id,
          managerName: r.manager_name,
          managerEmail: r.manager_email,
          managerPhone: r.manager_phone,
          nationalId: r.national_id,
          organization: r.organization,
          roleTitle: r.role_title,
          experienceYears: r.experience_years,
          propertyName: r.property_name,
          proposedHostelName: r.proposed_hostel_name || r.property_name,
          proposedLocation: r.proposed_location,
          proposedCapacity: r.proposed_capacity,
          notes: r.notes,
          reason: r.reason || r.notes,
          status: r.status,
          requestedAt: r.requested_at || r.created_at,
          approvedAt: r.approved_at,
          rejectedAt: r.rejected_at,
          adminNotes: r.admin_notes
        }));
      }
    } catch (err) {
      console.warn("Notice querying manager_registration_requests from Supabase:", err);
    }
  }
  return fallbackRequests;
}

export async function dbCreateManagerRequest(newReq: any): Promise<boolean> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("manager_registration_requests").insert([
        {
          id: /^[0-9a-fA-F-]{36}$/.test(newReq.id) ? newReq.id : generateUUID(),
          manager_id: /^[0-9a-fA-F-]{36}$/.test(newReq.managerId) ? newReq.managerId : null,
          manager_name: newReq.managerName,
          manager_email: newReq.managerEmail,
          manager_phone: newReq.managerPhone || null,
          national_id: newReq.nationalId || null,
          organization: newReq.organization || null,
          role_title: newReq.roleTitle || null,
          experience_years: Number(newReq.experienceYears) || 1,
          property_name: newReq.propertyName,
          proposed_hostel_name: newReq.proposedHostelName || newReq.propertyName,
          proposed_location: newReq.proposedLocation || null,
          proposed_capacity: Number(newReq.proposedCapacity) || 100,
          notes: newReq.notes || null,
          reason: newReq.reason || null,
          status: newReq.status || 'pending'
        }
      ]);
      return true;
    } catch (err) {
      console.warn("Notice inserting manager_registration_request to Supabase:", err);
    }
  }
  return false;
}

export async function dbUpdateManagerRequestStatus(id: string, status: 'approved' | 'rejected', notes?: string): Promise<boolean> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const now = new Date().toISOString();
      const updates: any = {
        status,
        updated_at: now
      };
      if (status === 'approved') updates.approved_at = now;
      if (status === 'rejected') updates.rejected_at = now;
      if (notes) updates.admin_notes = notes;

      await client.from("manager_registration_requests").update(updates).eq("id", id);
      return true;
    } catch (err) {
      console.warn("Notice updating manager_registration_request in Supabase:", err);
    }
  }
  return false;
}

// ==========================================
// MANAGER VERIFICATIONS DB HELPERS
// ==========================================

export async function dbGetManagerVerifications(fallbackList: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const { data, error } = await client
        .from("manager_verifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          managerId: r.manager_id,
          managerName: r.manager_name,
          managerEmail: r.manager_email,
          managerPhone: r.manager_phone,
          country: r.country,
          idDocumentType: r.id_document_type,
          hashedIdNumber: r.hashed_id_number,
          maskedIdNumber: r.masked_id_number,
          fullNameOnId: r.full_name_on_id,
          dateOfBirth: r.date_of_birth,
          idExpiryDate: r.id_expiry_date,
          idVerificationStatus: r.id_verification_status,
          authorityRelationship: r.authority_relationship,
          claimedOwnerName: r.claimed_owner_name,
          claimedOwnerPhone: r.claimed_owner_phone,
          claimedOwnerEmail: r.claimed_owner_email,
          organizationName: r.organization_name,
          organizationRegNumber: r.organization_reg_number,
          authorityEvidenceDescription: r.authority_evidence_description,
          authorityEvidenceFileName: r.authority_evidence_file_name,
          authorityEvidenceUrl: r.authority_evidence_url,
          authorityStatus: r.authority_status,
          systemChecks: r.system_checks || {},
          status: r.status,
          adminNotes: r.admin_notes,
          reviewedBy: r.reviewed_by,
          reviewedAt: r.reviewed_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
    } catch (err) {
      console.warn("Notice querying manager_verifications from Supabase:", err);
    }
  }
  return fallbackList;
}

export async function dbCreateManagerVerification(rec: any): Promise<boolean> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("manager_verifications").insert([
        {
          id: /^[0-9a-fA-F-]{36}$/.test(rec.id) ? rec.id : generateUUID(),
          manager_id: rec.managerId,
          manager_name: rec.managerName,
          manager_email: rec.managerEmail,
          manager_phone: rec.managerPhone,
          country: rec.country || 'Ghana',
          id_document_type: rec.idDocumentType || 'Ghana Card',
          hashed_id_number: rec.hashedIdNumber,
          masked_id_number: rec.maskedIdNumber || null,
          full_name_on_id: rec.fullNameOnId || null,
          date_of_birth: rec.dateOfBirth || null,
          id_expiry_date: rec.idExpiryDate || null,
          id_verification_status: rec.idVerificationStatus || 'verified',
          authority_relationship: rec.authorityRelationship || 'Authorized Manager',
          claimed_owner_name: rec.claimedOwnerName || null,
          claimed_owner_phone: rec.claimedOwnerPhone || null,
          claimed_owner_email: rec.claimedOwnerEmail || null,
          organization_name: rec.organizationName || null,
          organization_reg_number: rec.organizationRegNumber || null,
          authority_evidence_description: rec.authorityEvidenceDescription || null,
          authority_evidence_file_name: rec.authorityEvidenceFileName || null,
          authority_evidence_url: rec.authorityEvidenceUrl || null,
          authority_status: rec.authorityStatus || 'pending',
          system_checks: rec.systemChecks || {},
          status: rec.status || 'pending',
          admin_notes: rec.adminNotes || null
        }
      ]);
      return true;
    } catch (err) {
      console.warn("Notice inserting manager_verification to Supabase:", err);
    }
  }
  return false;
}

export async function dbUpdateManagerVerificationStatus(
  id: string,
  status: string,
  notes?: string,
  reviewedBy?: string
): Promise<boolean> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const now = new Date().toISOString();
      const updates: any = {
        status,
        updated_at: now,
        reviewed_at: now,
        reviewed_by: reviewedBy || 'Admin System'
      };
      if (notes) updates.admin_notes = notes;

      await client.from("manager_verifications").update(updates).eq("id", id);
      return true;
    } catch (err) {
      console.warn("Notice updating manager_verification in Supabase:", err);
    }
  }
  return false;
}

// ==========================================
// HOSTEL VERIFICATIONS DB HELPERS
// ==========================================

export async function dbGetHostelVerifications(fallbackList: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const { data, error } = await client
        .from("hostel_verifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          hostelId: r.hostel_id,
          hostelName: r.hostel_name,
          location: r.location,
          campusZone: r.campus_zone,
          addressLine1: r.address_line_1,
          digitalAddress: r.digital_address,
          totalCapacity: r.total_capacity,
          totalRooms: r.total_rooms,
          totalBlocks: r.total_blocks,
          pricePerYear: Number(r.price_per_year),
          currency: r.currency || 'GHS',
          facilities: r.facilities || [],
          imageUrl: r.image_url,
          managerId: r.manager_id,
          managerName: r.manager_name,
          managerEmail: r.manager_email,
          managerPhone: r.manager_phone,
          managerApproved: r.manager_approved,
          authorityRelationship: r.authority_relationship,
          ownerOperatorName: r.owner_operator_name,
          ownerOperatorPhone: r.owner_operator_phone,
          ownerOperatorEmail: r.owner_operator_email,
          proofOfOwnershipType: r.proof_of_ownership_type,
          proofOfOwnershipFileName: r.proof_of_ownership_file_name,
          proofOfOwnershipUrl: r.proof_of_ownership_url,
          systemValidation: r.system_validation || {},
          validationPassed: r.validation_passed,
          paymentStatus: r.payment_status,
          paymentReference: r.payment_reference,
          paymentAmount: Number(r.payment_amount || 50),
          paymentDate: r.payment_date,
          status: r.status,
          adminNotes: r.admin_notes,
          reviewedBy: r.reviewed_by,
          reviewedAt: r.reviewed_at,
          submittedAt: r.submitted_at || r.created_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
    } catch (err) {
      console.warn("Notice querying hostel_verifications from Supabase:", err);
    }
  }
  return fallbackList;
}

export async function dbCreateHostelVerification(rec: any): Promise<boolean> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("hostel_verifications").insert([
        {
          id: /^[0-9a-fA-F-]{36}$/.test(rec.id) ? rec.id : generateUUID(),
          hostel_id: rec.hostelId,
          hostel_name: rec.hostelName,
          location: rec.location,
          campus_zone: rec.campusZone || null,
          address_line_1: rec.addressLine1 || null,
          digital_address: rec.digitalAddress,
          total_capacity: rec.totalCapacity || 100,
          total_rooms: rec.totalRooms || 30,
          total_blocks: rec.totalBlocks || 2,
          price_per_year: rec.pricePerYear || 3500,
          currency: rec.currency || 'GHS',
          facilities: rec.facilities || [],
          image_url: rec.imageUrl || null,
          manager_id: rec.managerId,
          manager_name: rec.managerName,
          manager_email: rec.managerEmail,
          manager_phone: rec.managerPhone,
          manager_approved: rec.managerApproved ?? true,
          authority_relationship: rec.authorityRelationship || 'Authorized Manager',
          owner_operator_name: rec.ownerOperatorName,
          owner_operator_phone: rec.ownerOperatorPhone,
          owner_operator_email: rec.ownerOperatorEmail || null,
          proof_of_ownership_type: rec.proofOfOwnershipType || 'Authorization Letter',
          proof_of_ownership_file_name: rec.proofOfOwnershipFileName || null,
          proof_of_ownership_url: rec.proofOfOwnershipUrl || null,
          system_validation: rec.systemValidation || {},
          validation_passed: rec.validationPassed ?? true,
          payment_status: rec.paymentStatus || 'paid',
          payment_reference: rec.paymentReference || null,
          payment_amount: rec.paymentAmount || 50.00,
          payment_date: rec.paymentDate || new Date().toISOString(),
          status: rec.status || 'under_admin_review'
        }
      ]);
      return true;
    } catch (err) {
      console.warn("Notice inserting hostel_verification to Supabase:", err);
    }
  }
  return false;
}

export async function dbUpdateHostelVerificationStatus(
  id: string,
  status: string,
  notes?: string,
  reviewedBy?: string
): Promise<boolean> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const now = new Date().toISOString();
      const updates: any = {
        status,
        updated_at: now,
        reviewed_at: now,
        reviewed_by: reviewedBy || 'Admin System'
      };
      if (notes) updates.admin_notes = notes;

      await client.from("hostel_verifications").update(updates).eq("id", id);
      return true;
    } catch (err) {
      console.warn("Notice updating hostel_verification in Supabase:", err);
    }
  }
  return false;
}

// ==========================================
// AUDIT LOGS & ONBOARDING PAYMENTS DB HELPERS
// ==========================================

export async function dbCreateVerificationAuditLog(log: any): Promise<boolean> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("verification_audit_logs").insert([
        {
          id: /^[0-9a-fA-F-]{36}$/.test(log.id) ? log.id : generateUUID(),
          action: log.action,
          target_type: log.targetType,
          target_id: log.targetId,
          target_name: log.targetName || null,
          performed_by: log.performedBy,
          role: log.role || 'admin',
          details: log.details || {},
          ip_address: log.ipAddress || null,
          timestamp: log.timestamp || new Date().toISOString()
        }
      ]);
      return true;
    } catch (err) {
      console.warn("Notice inserting verification_audit_log to Supabase:", err);
    }
  }
  return false;
}

export async function dbGetVerificationAuditLogs(fallbackList: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      const { data, error } = await client
        .from("verification_audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);
      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          action: r.action,
          targetType: r.target_type,
          targetId: r.target_id,
          targetName: r.target_name,
          performedBy: r.performed_by,
          role: r.role,
          details: r.details || {},
          ipAddress: r.ip_address,
          timestamp: r.timestamp
        }));
      }
    } catch (err) {
      console.warn("Notice querying verification_audit_logs from Supabase:", err);
    }
  }
  return fallbackList;
}

export async function dbCreateOnboardingPayment(payment: any): Promise<boolean> {
  const { client, configured } = getSupabase();
  if (configured && client) {
    try {
      await client.from("hostel_onboarding_payments").insert([
        {
          id: /^[0-9a-fA-F-]{36}$/.test(payment.id) ? payment.id : generateUUID(),
          hostel_id: payment.hostelId,
          hostel_name: payment.hostelName,
          manager_id: payment.managerId,
          manager_name: payment.managerName,
          amount: payment.amount || 50.00,
          currency: payment.currency || 'GHS',
          status: payment.status || 'paid',
          reference: payment.reference,
          agreement_acknowledged: payment.agreementAcknowledged ?? true,
          payment_method: payment.paymentMethod || 'Manual Confirmation (Direct Agreement)',
          paid_at: payment.paidAt || new Date().toISOString()
        }
      ]);
      return true;
    } catch (err) {
      console.warn("Notice inserting hostel_onboarding_payment to Supabase:", err);
    }
  }
  return false;
}

