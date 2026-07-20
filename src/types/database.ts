// GENERATED FILE — do not hand-edit. Previously hand-maintained with
// Insert/Update typed as `any`, which silently let schema/type drift go
// uncaught (see PROJECT_AUDIT.md, H5). Regenerate with `npm run gen:types`
// (spins up a local Supabase/Docker stack, applies supabase/migrations/*,
// and generates real types via the Supabase CLI) after any schema change.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          group_name: string | null
          id: string
          is_group: boolean | null
          last_message_at: string | null
          participants: string[]
        }
        Insert: {
          created_at?: string | null
          group_name?: string | null
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          participants: string[]
        }
        Update: {
          created_at?: string | null
          group_name?: string | null
          id?: string
          is_group?: boolean | null
          last_message_at?: string | null
          participants?: string[]
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          actual_fee: number | null
          created_at: string | null
          deleted_at: string | null
          delivery_address: string
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_type: string
          distance_km: number | null
          estimated_fee: number | null
          id: string
          order_id: string | null
          package_description: string | null
          package_size: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          pickup_address: string
          pickup_lat: number | null
          pickup_lng: number | null
          rider_id: string | null
          sender_id: string
          special_instructions: string | null
          status: string
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          actual_fee?: number | null
          created_at?: string | null
          deleted_at?: string | null
          delivery_address: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_type: string
          distance_km?: number | null
          estimated_fee?: number | null
          id?: string
          order_id?: string | null
          package_description?: string | null
          package_size?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          pickup_address: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rider_id?: string | null
          sender_id: string
          special_instructions?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_fee?: number | null
          created_at?: string | null
          deleted_at?: string | null
          delivery_address?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_type?: string
          distance_km?: number | null
          estimated_fee?: number | null
          id?: string
          order_id?: string | null
          package_description?: string | null
          package_size?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rider_id?: string | null
          sender_id?: string
          special_instructions?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fcm_tokens: {
        Row: {
          created_at: string | null
          device_info: string | null
          id: string
          profile_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          profile_id: string
          token: string
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          id?: string
          profile_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "fcm_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          file_url: string | null
          id: string
          is_read: boolean | null
          room_id: string
          sender_id: string
          type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          room_id: string
          sender_id: string
          type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          room_id?: string
          sender_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_broadcasts: {
        Row: {
          audience: string
          body: string
          created_at: string
          id: string
          recipient_count: number
          sent_by: string | null
          title: string
        }
        Insert: {
          audience: string
          body: string
          created_at?: string
          id?: string
          recipient_count?: number
          sent_by?: string | null
          title: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          id?: string
          recipient_count?: number
          sent_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_broadcasts_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string | null
          deleted_at: string | null
          delivery_address: string | null
          delivery_fee: number | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          seller_id: string
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          deleted_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          seller_id: string
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          deleted_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          seller_id?: string
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          condition: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          location: string | null
          original_price: number | null
          price: number
          rating: number | null
          seller_id: string
          status: string
          stock_quantity: number
          tags: string[] | null
          title: string
          total_reviews: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          category_id?: string | null
          condition?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          location?: string | null
          original_price?: number | null
          price: number
          rating?: number | null
          seller_id: string
          status?: string
          stock_quantity?: number
          tags?: string[] | null
          title: string
          total_reviews?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          category_id?: string | null
          condition?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          location?: string | null
          original_price?: number | null
          price?: number
          rating?: number | null
          seller_id?: string
          status?: string
          stock_quantity?: number
          tags?: string[] | null
          title?: string
          total_reviews?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          deleted_at: string | null
          department: string | null
          full_name: string | null
          hall_of_residence: string | null
          id: string
          is_verified: boolean | null
          location: string | null
          notification_preferences: Json
          phone: string | null
          rating: number | null
          role: string
          status: string
          student_id: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          year_of_study: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department?: string | null
          full_name?: string | null
          hall_of_residence?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          notification_preferences?: Json
          phone?: string | null
          rating?: number | null
          role?: string
          status?: string
          student_id?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          year_of_study?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          deleted_at?: string | null
          department?: string | null
          full_name?: string | null
          hall_of_residence?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          notification_preferences?: Json
          phone?: string | null
          rating?: number | null
          role?: string
          status?: string
          student_id?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          year_of_study?: number | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order_amount: number
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_amount?: number
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_amount?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          paystack_reference: string | null
          reason: string | null
          status: string
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          paystack_reference?: string | null
          reason?: string | null
          status?: string
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          paystack_reference?: string | null
          reason?: string | null
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          is_hidden: boolean | null
          is_verified_purchase: boolean | null
          rating: number
          reference_id: string
          reviewed_id: string
          reviewer_id: string
          type: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_verified_purchase?: boolean | null
          rating: number
          reference_id: string
          reviewed_id: string
          reviewer_id: string
          type: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_verified_purchase?: boolean | null
          rating?: number
          reference_id?: string
          reviewed_id?: string
          reviewer_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_profiles: {
        Row: {
          created_at: string | null
          current_lat: number | null
          current_lng: number | null
          document_urls: string[] | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          license_number: string | null
          rating: number | null
          total_deliveries: number | null
          total_trips: number | null
          user_id: string
          vehicle_number: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          document_urls?: string[] | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          rating?: number | null
          total_deliveries?: number | null
          total_trips?: number | null
          user_id: string
          vehicle_number?: string | null
          vehicle_type: string
        }
        Update: {
          created_at?: string | null
          current_lat?: number | null
          current_lng?: number | null
          document_urls?: string[] | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          rating?: number | null
          total_deliveries?: number | null
          total_trips?: number | null
          user_id?: string
          vehicle_number?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          actual_fare: number | null
          created_at: string | null
          deleted_at: string | null
          destination_address: string
          destination_lat: number | null
          destination_lng: number | null
          distance_km: number | null
          duration_minutes: number | null
          estimated_fare: number | null
          id: string
          notes: string | null
          passenger_id: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          pickup_address: string
          pickup_lat: number | null
          pickup_lng: number | null
          rating: number | null
          rider_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_fare?: number | null
          created_at?: string | null
          deleted_at?: string | null
          destination_address: string
          destination_lat?: number | null
          destination_lng?: number | null
          distance_km?: number | null
          duration_minutes?: number | null
          estimated_fare?: number | null
          id?: string
          notes?: string | null
          passenger_id: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          pickup_address: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rating?: number | null
          rider_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          actual_fare?: number | null
          created_at?: string | null
          deleted_at?: string | null
          destination_address?: string
          destination_lat?: number | null
          destination_lng?: number | null
          distance_km?: number | null
          duration_minutes?: number | null
          estimated_fare?: number | null
          id?: string
          notes?: string | null
          passenger_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rating?: number | null
          rider_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_applications: {
        Row: {
          applicant_id: string
          cover_message: string | null
          created_at: string | null
          id: string
          proposed_price: number | null
          status: string
          task_id: string
        }
        Insert: {
          applicant_id: string
          cover_message?: string | null
          created_at?: string | null
          id?: string
          proposed_price?: number | null
          status?: string
          task_id: string
        }
        Update: {
          applicant_id?: string
          cover_message?: string | null
          created_at?: string | null
          id?: string
          proposed_price?: number | null
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_applications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          category: string
          created_at: string | null
          deadline: string
          deleted_at: string | null
          description: string
          id: string
          images: string[] | null
          is_urgent: boolean | null
          location: string | null
          payment_reference: string | null
          payment_status: string | null
          poster_id: string
          reward: number
          status: string
          title: string
          total_applicants: number | null
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          category: string
          created_at?: string | null
          deadline: string
          deleted_at?: string | null
          description: string
          id?: string
          images?: string[] | null
          is_urgent?: boolean | null
          location?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          poster_id: string
          reward: number
          status?: string
          title: string
          total_applicants?: number | null
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          category?: string
          created_at?: string | null
          deadline?: string
          deleted_at?: string | null
          description?: string
          id?: string
          images?: string[] | null
          is_urgent?: boolean | null
          location?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          poster_id?: string
          reward?: number
          status?: string
          title?: string
          total_applicants?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          reference: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          reference: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          reference?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          is_typing: boolean | null
          profile_id: string
          room_id: string
          updated_at: string | null
        }
        Insert: {
          is_typing?: boolean | null
          profile_id: string
          room_id: string
          updated_at?: string | null
        }
        Update: {
          is_typing?: boolean | null
          profile_id?: string
          room_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          is_online: boolean | null
          last_seen: string | null
          profile_id: string
        }
        Insert: {
          is_online?: boolean | null
          last_seen?: string | null
          profile_id: string
        }
        Update: {
          is_online?: boolean | null
          last_seen?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          currency: string | null
          id: string
          is_locked: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          currency?: string | null
          id?: string
          is_locked?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          currency?: string | null
          id?: string
          is_locked?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_product_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: boolean
      }
      decrement_wallet_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      get_profile_id: { Args: never; Returns: string }
      increment_wallet_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

