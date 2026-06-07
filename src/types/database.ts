export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableRow<T> = T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableInsert<_T> = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableUpdate<_T> = any;

export interface Database {
  public: {
    Tables: {
      profiles: { Row: TableRow<Profile>; Insert: TableInsert<Profile>; Update: TableUpdate<Profile> };
      products: { Row: TableRow<Product>; Insert: TableInsert<Product>; Update: TableUpdate<Product> };
      tasks: { Row: TableRow<Task>; Insert: TableInsert<Task>; Update: TableUpdate<Task> };
      task_applications: { Row: TableRow<TaskApplication>; Insert: TableInsert<TaskApplication>; Update: TableUpdate<TaskApplication> };
      orders: { Row: TableRow<Order>; Insert: TableInsert<Order>; Update: TableUpdate<Order> };
      order_items: { Row: TableRow<OrderItem>; Insert: TableInsert<OrderItem>; Update: TableUpdate<OrderItem> };
      cart_items: { Row: TableRow<CartItem>; Insert: TableInsert<CartItem>; Update: TableUpdate<CartItem> };
      rides: { Row: TableRow<Ride>; Insert: TableInsert<Ride>; Update: TableUpdate<Ride> };
      deliveries: { Row: TableRow<Delivery>; Insert: TableInsert<Delivery>; Update: TableUpdate<Delivery> };
      messages: { Row: TableRow<Message>; Insert: TableInsert<Message>; Update: TableUpdate<Message> };
      chat_rooms: { Row: TableRow<ChatRoom>; Insert: TableInsert<ChatRoom>; Update: TableUpdate<ChatRoom> };
      notifications: { Row: TableRow<Notification>; Insert: TableInsert<Notification>; Update: TableUpdate<Notification> };
      wallets: { Row: TableRow<Wallet>; Insert: TableInsert<Wallet>; Update: TableUpdate<Wallet> };
      transactions: { Row: TableRow<Transaction>; Insert: TableInsert<Transaction>; Update: TableUpdate<Transaction> };
      refunds: { Row: TableRow<Refund>; Insert: TableInsert<Refund>; Update: TableUpdate<Refund> };
      reviews: { Row: TableRow<Review>; Insert: TableInsert<Review>; Update: TableUpdate<Review> };
      categories: { Row: TableRow<Category>; Insert: TableInsert<Category>; Update: TableUpdate<Category> };

      rider_profiles: { Row: TableRow<RiderProfile>; Insert: TableInsert<RiderProfile>; Update: TableUpdate<RiderProfile> };
      fcm_tokens: { Row: TableRow<FcmToken>; Insert: TableInsert<FcmToken>; Update: TableUpdate<FcmToken> };
      admin_logs: { Row: TableRow<AdminLog>; Insert: TableInsert<AdminLog>; Update: TableUpdate<AdminLog> };
      audit_logs: { Row: TableRow<AuditLog>; Insert: TableInsert<AuditLog>; Update: TableUpdate<AuditLog> };
      user_presence: { Row: TableRow<UserPresence>; Insert: TableInsert<UserPresence>; Update: TableUpdate<UserPresence> };
      typing_indicators: { Row: TableRow<TypingIndicator>; Insert: TableInsert<TypingIndicator>; Update: TableUpdate<TypingIndicator> };
      platform_settings: { Row: TableRow<PlatformSetting>; Insert: TableInsert<PlatformSetting>; Update: TableUpdate<PlatformSetting> };
    };
    Views: Record<string, never>;
    Functions: {
      increment_wallet_balance: { Args: { p_user_id: string; p_amount: number }; Returns: void };
      decrement_product_stock: { Args: { p_product_id: string; p_quantity: number }; Returns: boolean };
      get_profile_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
  };
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  hall_of_residence: string | null;
  department: string | null;
  year_of_study: number | null;
  student_id: string | null;
  role: "student" | "rider" | "admin";
  status: "active" | "suspended" | "pending" | "banned";
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  seller_id: string;

  category_id: string | null;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  condition: "new" | "like_new" | "good" | "fair" | "poor";
  images: string[];
  tags: string[];
  location: string | null;
  stock_quantity: number;
  status: "active" | "sold" | "pending" | "rejected";
  views: number;
  rating: number;
  total_reviews: number;
  is_featured: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  poster_id: string;
  assignee_id: string | null;
  title: string;
  description: string;
  category: string;
  reward: number;
  deadline: string;
  location: string | null;
  status: string;
  images: string[];
  is_urgent: boolean;
  total_applicants: number;
  payment_reference: string | null;
  payment_status: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskApplication {
  id: string;
  task_id: string;
  applicant_id: string;
  cover_message: string | null;
  proposed_price: number | null;
  status: string;
  created_at: string;
}

interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  payment_method: string | null;
  payment_status: string;
  payment_reference: string | null;
  delivery_address: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

interface Ride {
  id: string;
  passenger_id: string;
  rider_id: string | null;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  destination_address: string;
  destination_lat: number | null;
  destination_lng: number | null;
  estimated_fare: number | null;
  actual_fare: number | null;
  distance_km: number | null;
  duration_minutes: number | null;
  status: string;
  payment_method: string | null;
  payment_status: string;
  payment_reference: string | null;
  rating: number | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Delivery {
  id: string;
  sender_id: string;
  rider_id: string | null;
  delivery_type: string;
  pickup_address: string;
  delivery_address: string;
  status: string;
  created_at: string;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: string;
  file_url: string | null;
  is_read: boolean;
  deleted_at: string | null;
  created_at: string;
}

interface ChatRoom {
  id: string;
  participants: string[];
  last_message_at: string | null;
  is_group: boolean;
  group_name: string | null;
  created_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Json | null;
  is_read: boolean;
  created_at: string;
}

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  is_locked: boolean;
  updated_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  reference: string;
  status: string;
  description: string | null;
  metadata: Json | null;
  created_at: string;
}

interface Refund {
  id: string;
  transaction_id: string;
  amount: number;
  reason: string | null;
  status: string;
  paystack_reference: string | null;
  created_at: string;
}

interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  type: string;
  reference_id: string;
  rating: number;
  comment: string | null;
  is_verified_purchase: boolean;
  is_hidden: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}



interface RiderProfile {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_number: string | null;
  license_number: string | null;
  document_urls: string[];
  is_verified: boolean;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  rating: number;
  total_trips: number;
  total_deliveries: number;
  created_at: string;
}

interface FcmToken {
  id: string;
  profile_id: string;
  token: string;
  device_info: string | null;
  created_at: string;
}

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  created_at: string;
}

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: Json | null;
  new_data: Json | null;
  actor_id: string | null;
  ip_address: string | null;
  created_at: string;
}

interface UserPresence {
  profile_id: string;
  is_online: boolean;
  last_seen: string;
}

interface TypingIndicator {
  room_id: string;
  profile_id: string;
  is_typing: boolean;
  updated_at: string;
}

interface PlatformSetting {
  key: string;
  value: Json;
  updated_at: string;
}
