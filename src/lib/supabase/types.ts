/**
 * Database types for the Sewa schema. Hand-written to match
 * supabase/migrations. Once a Supabase project exists you can regenerate with:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 */

export type UserRole = "buyer" | "seller" | "admin";
export type ServiceStatus = "draft" | "active" | "paused";
export type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "refunded"
  | "partially_refunded";
export type EscrowStatus = "held" | "released" | "refunded";
export type NicStatus = "pending" | "approved" | "rejected";
export type RefundStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "processing"
  | "completed";
export type RefundReason = "quality" | "incomplete" | "no_show" | "other";
export type PayoutStatus =
  | "pending"
  | "approved"
  | "processing"
  | "completed"
  | "failed";
export type WalletEntryType =
  | "earning"
  | "payout"
  | "refund_clawback"
  | "guarantee_reserve"
  | "adjustment";
export type WalletEntryStatus = "pending" | "available" | "withdrawn" | "reversed";
export type Actor = "buyer" | "seller" | "admin" | "system";
export type ActiveContext = "buyer" | "seller";
export type PlanKey = "starter" | "pro" | "business";
export type PackageTier = "basic" | "standard" | "premium";
export type MessageType = "text" | "photo" | "location";
export type ReportStatus = "open" | "reviewing" | "resolved";

type Timestamps = { created_at: string; updated_at: string };

export interface Profile extends Timestamps {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  phone_verified: boolean;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  active_context: ActiveContext;
}

export interface SellerProfile extends Timestamps {
  id: string;
  user_id: string;
  rating: number;
  total_reviews: number;
  total_bookings: number;
  nic_verified: boolean;
  nic_verified_at: string | null;
  commission_rate: number;
  is_pro: boolean;
  availability: Record<string, [string, string][]>;
  strikes: number;
  suspended: boolean;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  description: string | null;
  service_areas: string[];
  plan_id: string | null;
  plan_renews_at: string | null;
}

export interface Plan {
  id: string;
  key: PlanKey;
  name: string;
  price_lkr: number;
  commission_rate: number;
  ad_limit: number;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Service extends Timestamps {
  id: string;
  seller_id: string;
  category_id: string;
  subcategory_id: string | null;
  title: string;
  description: string;
  price: number; // "starting from" cache = cheapest active package's price
  price_unit: string;
  location_area: string | null;
  status: ServiceStatus;
  rating: number;
  total_bookings: number;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ServicePackage {
  id: string;
  service_id: string;
  tier: PackageTier;
  name: string;
  description: string;
  price: number;
  price_unit: string;
  delivery_days: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Booking extends Timestamps {
  id: string;
  buyer_id: string;
  seller_id: string;
  service_id: string;
  package_id: string | null;
  status: BookingStatus;
  scheduled_at: string;
  duration_hours: number;
  location: string | null;
  notes: string | null;
  service_amount: number;
  buyer_fee: number;
  total_charged: number;
  seller_commission: number;
  guarantee_reserve: number;
  seller_net: number;
  platform_net: number;
  accepted_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: Actor | null;
  cancel_reason: string | null;
  cancellation_fee: number;
  reschedule_proposed_at: string | null;
  reschedule_requested_by: Actor | null;
  reschedule_note: string | null;
}

export interface BookingPins {
  id: string;
  booking_id: string;
  start_pin_hash: string;
  end_pin_hash: string;
  start_pin_verified_at: string | null;
  end_pin_verified_at: string | null;
  start_pin_attempts: number;
  end_pin_attempts: number;
  start_pin_locked_until: string | null;
  end_pin_locked_until: string | null;
  created_at: string;
}

export interface Payment extends Timestamps {
  id: string;
  booking_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  escrow_status: EscrowStatus;
  payhere_order_id: string | null;
  payhere_payment_id: string | null;
  payment_method: string | null;
  hold_until: string | null;
  released_at: string | null;
}

export interface WalletEntry {
  id: string;
  seller_id: string;
  booking_id: string | null;
  type: WalletEntryType;
  amount: number;
  status: WalletEntryStatus;
  available_at: string | null;
  note: string | null;
  created_at: string;
}

export interface NicVerification extends Timestamps {
  id: string;
  user_id: string;
  nic_number_enc: string | null;
  nic_masked: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  document_url: string | null;
  status: NicStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  seller_id: string;
  service_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Refund extends Timestamps {
  id: string;
  payment_id: string;
  booking_id: string;
  requester_id: string;
  amount: number;
  reason: RefundReason;
  explanation: string | null;
  status: RefundStatus;
  refund_method: string;
  approved_by: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  payhere_refund_id: string | null;
  processed_at: string | null;
}

export interface Payout extends Timestamps {
  id: string;
  seller_id: string;
  amount: number;
  status: PayoutStatus;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  payhere_payout_id: string | null;
  requested_at: string;
  approved_by: string | null;
  approved_at: string | null;
  processed_at: string | null;
  failure_reason: string | null;
}

export interface PaymentLog {
  id: string;
  payment_id: string | null;
  event_type: string;
  previous_status: string | null;
  new_status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  booking_id: string | null;
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  body: string | null;
  photo_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_label: string | null;
  created_at: string;
}

export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  booking_id: string | null;
  category: string;
  subject: string;
  details: string | null;
  photo_url: string | null;
  status: ReportStatus;
  created_at: string;
}

/** Generic table shape: Row is the selected row; Insert/Update are loose. */
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile>;
      seller_profiles: Table<SellerProfile>;
      categories: Table<Category>;
      subcategories: Table<Subcategory>;
      services: Table<Service>;
      service_packages: Table<ServicePackage>;
      plans: Table<Plan>;
      bookings: Table<Booking>;
      booking_pins: Table<BookingPins>;
      payments: Table<Payment>;
      wallet_entries: Table<WalletEntry>;
      nic_verifications: Table<NicVerification>;
      reviews: Table<Review>;
      refunds: Table<Refund>;
      payouts: Table<Payout>;
      payment_logs: Table<PaymentLog>;
      audit_logs: Table<AuditLog>;
      conversations: Table<Conversation>;
      messages: Table<Message>;
      blocks: Table<Block>;
      reports: Table<Report>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Enums: {
      user_role: UserRole;
      service_status: ServiceStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      escrow_status: EscrowStatus;
      nic_status: NicStatus;
      refund_status: RefundStatus;
      refund_reason: RefundReason;
      payout_status: PayoutStatus;
      wallet_entry_type: WalletEntryType;
      wallet_entry_status: WalletEntryStatus;
      actor: Actor;
    };
  };
}
