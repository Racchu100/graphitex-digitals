// ─── Phase 1 Database Types ───────────────────────────────────────
// Mirror of Supabase Postgres schema.
// Row = full row, Insert = required for insert, Update = partial for update.

// ── Location Tables ──────────────────────────────────────────────

export interface Country {
  id: number;
  name: string;
  iso_code: string;
  phone_code: string;
}

export interface State {
  id: number;
  country_id: number;
  name: string;
}

export interface City {
  id: number;
  state_id: number;
  name: string;
}

// ── Categories ───────────────────────────────────────────────────

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

// ── Users ────────────────────────────────────────────────────────

export type UserStatus = "active" | "pending" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string | null;
  mobile_number: string;
  mobile_verified: boolean;
  country_id: number;
  state_id: number;
  city_id: number;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  name: string;
  email?: string | null;
  mobile_number: string;
  mobile_verified?: boolean;
  country_id: number;
  state_id: number;
  city_id: number;
  avatar_url?: string | null;
  status?: UserStatus;
}

export interface UserUpdate {
  name?: string;
  email?: string | null;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  avatar_url?: string | null;
  status?: UserStatus;
}

// ── User Roles ───────────────────────────────────────────────────

export type RoleName = "influencer" | "provider" | "admin";
export type ProviderSubtype =
  | "business_owner"
  | "freelancer"
  | "local_service";

export interface UserRole {
  id: number;
  user_id: string;
  role: RoleName;
  provider_subtype: ProviderSubtype | null;
  granted_by: string | null;
  created_at: string;
}

export interface UserRoleInsert {
  user_id: string;
  role: RoleName;
  provider_subtype?: ProviderSubtype | null;
  granted_by?: string | null;
}

// ── Platform Config ──────────────────────────────────────────────

export interface PlatformConfig {
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

// ── OTP Verifications (audit) ────────────────────────────────────

export interface OtpVerification {
  id: number;
  mobile_number: string;
  purpose: string;
  consumed_at: string | null;
  created_at: string;
  expires_at: string;
}

// ── Phase 2: Business & Influencer Profiles ──────────────────────

export type BusinessProfileStatus = "draft" | "pending_approval" | "approved" | "rejected" | "suspended";
export type InfluencerProfileStatus = "draft" | "published" | "suspended";

export interface BusinessProfile {
  id: string;
  user_id: string;
  provider_type: ProviderSubtype;
  business_name: string;
  tagline: string | null;
  description: string;
  category_id: number;
  contact_type: "whatsapp" | "phone";
  whatsapp_number: string | null;
  contact_number: string | null;
  website_url: string | null;
  instagram_handle: string | null;
  address_line: string | null;
  country_id: number;
  state_id: number;
  city_id: number;
  is_public: boolean;
  status: BusinessProfileStatus;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  map_embed_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessMedia {
  id: number;
  business_profile_id: string;
  media_type: "image" | "video";
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProfileApproval {
  id: number;
  business_profile_id: string;
  reviewed_by: string;
  decision: "approved" | "rejected";
  reason: string | null;
  created_at: string;
}

export interface InfluencerProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  profile_picture_url: string;
  niche_category_id: number | null;
  niche_category_ids?: number[] | null;
  price_min: number;
  price_max: number;
  currency: string;
  contact_number: string | null;
  country_id: number;
  state_id: number;
  city_id: number;
  is_public: boolean;
  status: InfluencerProfileStatus;
  created_at: string;
  updated_at: string;
}

export interface InfluencerSocialAccount {
  id: number;
  influencer_profile_id: string;
  platform: "instagram" | "youtube" | "facebook";
  profile_url: string;
  external_id: string | null;
  handle: string | null;
  follower_count: number;
  count_source: "auto" | "manual";
  is_verified: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactRevealLog {
  id: number;
  provider_user_id: string;
  influencer_profile_id: string;
  revealed_at: string;
}

// ── Phase 3: Opportunities & Connections ────────────────────────

export type OpportunityStatus = "draft" | "active" | "expired" | "closed" | "removed";
export type ApplicationStatus = "applied" | "viewed" | "contacted" | "accepted" | "rejected";

export interface Opportunity {
  id: string;
  business_profile_id: string;
  posted_by_user_id: string;
  title: string;
  purpose: string;
  description: string;
  price_min: number;
  price_max: number;
  currency: string;
  min_followers: number;
  platform_preference: "instagram" | "youtube" | "facebook" | "any";
  starts_at: string;
  expires_at: string;
  status: OpportunityStatus;
  removed_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpportunityApplication {
  id: number;
  opportunity_id: string;
  influencer_profile_id: string;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

// ── Supabase Database Type Map ───────────────────────────────────

export interface Database {
  public: {
    Tables: {
      countries: {
        Row: Country;
        Insert: Omit<Country, "id">;
        Update: Partial<Omit<Country, "id">>;
      };
      states: {
        Row: State;
        Insert: Omit<State, "id">;
        Update: Partial<Omit<State, "id">>;
      };
      cities: {
        Row: City;
        Insert: Omit<City, "id">;
        Update: Partial<Omit<City, "id">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Omit<Category, "id">>;
      };
      users: {
        Row: User;
        Insert: UserInsert & { id?: string };
        Update: UserUpdate;
      };
      user_roles: {
        Row: UserRole;
        Insert: UserRoleInsert;
        Update: Partial<UserRoleInsert>;
      };
      platform_config: {
        Row: PlatformConfig;
        Insert: Omit<PlatformConfig, "updated_at"> & {
          updated_at?: string;
        };
        Update: Partial<Omit<PlatformConfig, "key">>;
      };
      otp_verifications: {
        Row: OtpVerification;
        Insert: Omit<OtpVerification, "id" | "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Omit<OtpVerification, "id">>;
      };
      business_profiles: {
        Row: BusinessProfile;
        Insert: Omit<BusinessProfile, "id" | "created_at" | "updated_at"> & { id?: string, created_at?: string, updated_at?: string };
        Update: Partial<Omit<BusinessProfile, "id">>;
      };
      business_media: {
        Row: BusinessMedia;
        Insert: Omit<BusinessMedia, "id" | "created_at"> & { created_at?: string };
        Update: Partial<Omit<BusinessMedia, "id">>;
      };
      profile_approvals: {
        Row: ProfileApproval;
        Insert: Omit<ProfileApproval, "id" | "created_at"> & { created_at?: string };
        Update: Partial<Omit<ProfileApproval, "id">>;
      };
      influencer_profiles: {
        Row: InfluencerProfile;
        Insert: Omit<InfluencerProfile, "id" | "created_at" | "updated_at"> & { id?: string, created_at?: string, updated_at?: string };
        Update: Partial<Omit<InfluencerProfile, "id">>;
      };
      influencer_social_accounts: {
        Row: InfluencerSocialAccount;
        Insert: Omit<InfluencerSocialAccount, "id" | "created_at" | "updated_at"> & { created_at?: string, updated_at?: string };
        Update: Partial<Omit<InfluencerSocialAccount, "id">>;
      };
      contact_reveal_log: {
        Row: ContactRevealLog;
        Insert: Omit<ContactRevealLog, "id" | "revealed_at"> & { revealed_at?: string };
        Update: Partial<Omit<ContactRevealLog, "id">>;
      };
      opportunities: {
        Row: Opportunity;
        Insert: Omit<Opportunity, "id" | "created_at" | "updated_at"> & { id?: string, created_at?: string, updated_at?: string };
        Update: Partial<Omit<Opportunity, "id">>;
      };
      opportunity_applications: {
        Row: OpportunityApplication;
        Insert: Omit<OpportunityApplication, "id" | "created_at" | "updated_at"> & { created_at?: string, updated_at?: string };
        Update: Partial<Omit<OpportunityApplication, "id">>;
      };
    };
  };
}

// ── Composite / API Response Types ───────────────────────────────

export interface UserWithRoles extends User {
  roles: UserRole[];
}

export interface LocationCascade {
  countries: Country[];
  states: State[];
  cities: City[];
}

// ── Onboarding Form Types ────────────────────────────────────────

export interface OnboardingStep1 {
  name: string;
  email?: string;
}

export interface OnboardingStep2 {
  country_id: number;
  state_id: number;
  city_id: number;
}

export interface OnboardingStep3 {
  roles: {
    influencer: boolean;
    provider: boolean;
  };
  provider_subtype?: ProviderSubtype;
}

export interface OnboardingFormData
  extends OnboardingStep1,
    OnboardingStep2,
    OnboardingStep3 {}
