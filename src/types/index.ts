// CampusPulse – Full Type System

export type UserRole = "student" | "vendor" | "rider" | "admin";

export type UserStatus = "active" | "suspended" | "pending" | "banned";

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  hall_of_residence?: string;
  department?: string;
  year_of_study?: number;
  student_id?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

// ── EDWOM ────────────────────────────────────────────────────────────────────

export type ProductCondition = "new" | "like_new" | "good" | "fair" | "poor";

export type ProductStatus = "active" | "sold" | "pending" | "rejected";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  seller_id: string;
  store_id?: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  condition: ProductCondition;
  images: string[];
  tags?: string[];
  location?: string;
  stock_quantity: number;
  status: ProductStatus;
  views: number;
  rating: number;
  total_reviews: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  seller?: Profile;
  category?: Category;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  location?: string;
  phone?: string;
  email?: string;
  is_verified: boolean;
  is_active: boolean;
  rating: number;
  total_sales: number;
  created_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number;
  payment_method: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_reference?: string;
  delivery_address?: string;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// ── Y3 ADWUMA ─────────────────────────────────────────────────────────────────

export type TaskStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export type TaskCategory =
  | "academic"
  | "delivery"
  | "printing"
  | "food"
  | "laundry"
  | "tech"
  | "design"
  | "event"
  | "other";

export interface Task {
  id: string;
  poster_id: string;
  assignee_id?: string;
  title: string;
  description: string;
  category: TaskCategory;
  reward: number;
  deadline: string;
  location?: string;
  status: TaskStatus;
  images?: string[];
  is_urgent: boolean;
  total_applicants: number;
  created_at: string;
  updated_at: string;
  poster?: Profile;
  assignee?: Profile;
}

export interface TaskApplication {
  id: string;
  task_id: string;
  applicant_id: string;
  cover_message?: string;
  proposed_price?: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  applicant?: Profile;
}

// ── EZZYRIDE ──────────────────────────────────────────────────────────────────

export type RideStatus =
  | "searching"
  | "accepted"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export type DeliveryType =
  | "food"
  | "package"
  | "marketplace"
  | "document"
  | "student_to_student";

export interface Ride {
  id: string;
  passenger_id: string;
  rider_id?: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  estimated_fare: number;
  actual_fare?: number;
  distance_km?: number;
  duration_minutes?: number;
  status: RideStatus;
  payment_method: string;
  payment_status: "pending" | "paid";
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  passenger?: Profile;
  rider?: RiderProfile;
}

export interface Delivery {
  id: string;
  sender_id: string;
  rider_id?: string;
  delivery_type: DeliveryType;
  pickup_address: string;
  delivery_address: string;
  package_description?: string;
  package_size: "small" | "medium" | "large";
  estimated_fee: number;
  actual_fee?: number;
  status: RideStatus;
  tracking_code: string;
  payment_method: string;
  payment_status: "pending" | "paid";
  special_instructions?: string;
  created_at: string;
}

export interface RiderProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  phone: string;
  vehicle_type: "bicycle" | "motorbike" | "car";
  vehicle_number?: string;
  license_number?: string;
  is_verified: boolean;
  is_available: boolean;
  current_lat?: number;
  current_lng?: number;
  rating: number;
  total_trips: number;
  total_deliveries: number;
  created_at: string;
}

// ── CHAT ──────────────────────────────────────────────────────────────────────

export interface ChatRoom {
  id: string;
  participants: string[];
  last_message?: Message;
  last_message_at?: string;
  is_group: boolean;
  group_name?: string;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  file_url?: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────

export type ReviewType = "product" | "vendor" | "task_worker" | "rider" | "delivery";

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  type: ReviewType;
  reference_id: string; // product_id, task_id, ride_id, etc.
  rating: number;
  comment?: string;
  is_verified_purchase: boolean;
  created_at: string;
  reviewer?: Profile;
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────────

export type PaymentMethod = "mtn_momo" | "telecel" | "airteltigo" | "card";

export interface Transaction {
  id: string;
  user_id: string;
  type: "payment" | "refund" | "escrow" | "withdrawal" | "top_up";
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  reference: string;
  status: "pending" | "success" | "failed" | "reversed";
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  is_locked: boolean;
  updated_at: string;
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "order_update"
  | "task_update"
  | "ride_update"
  | "message"
  | "promotion"
  | "system"
  | "review";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface AnalyticsData {
  total_users: number;
  total_students: number;
  total_vendors: number;
  total_riders: number;
  total_orders: number;
  total_tasks: number;
  total_deliveries: number;
  total_revenue: number;
  new_users_today: number;
  orders_today: number;
  revenue_today: number;
}
