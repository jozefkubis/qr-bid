export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          clerk_user_id: string;
          created_at: string;
          display_name: string | null;
          id: string;
          preferred_locale: "en" | "sk";
          updated_at: string;
        };
        Insert: {
          clerk_user_id: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          preferred_locale?: "en" | "sk";
          updated_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      auctions: {
        Row: {
          created_at: string;
          currency: "EUR";
          description: string;
          ends_at: string;
          id: string;
          location: string | null;
          min_increment_minor: number;
          owner_id: string;
          starting_price_minor: number;
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: "EUR";
          description?: string;
          ends_at: string;
          id?: string;
          location?: string | null;
          min_increment_minor: number;
          owner_id: string;
          starting_price_minor: number;
          starts_at?: string;
          title: string;
          updated_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "auctions_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      auction_photos: {
        Row: {
          auction_id: string;
          created_at: string;
          id: string;
          sort_order: number;
          storage_path: string;
        };
        Insert: {
          auction_id: string;
          created_at?: string;
          id?: string;
          sort_order: number;
          storage_path: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "auction_photos_auction_id_fkey";
            columns: ["auction_id"];
            isOneToOne: false;
            referencedRelation: "auctions";
            referencedColumns: ["id"];
          },
        ];
      };
      bids: {
        Row: {
          amount_minor: number;
          auction_id: string;
          bidder_id: string;
          created_at: string;
          id: string;
          request_id: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      auction_notes: {
        Row: {
          auction_id: string;
          body: string;
          created_at: string;
          id: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_notification_outbox: {
        Args: { p_limit?: number };
        Returns: {
          amount_minor: number | null;
          attempt_count: number;
          auction_id: string;
          auction_title: string;
          currency: string;
          expires_at: string | null;
          finalization_status: string;
          job_id: string;
          locale: "en" | "sk";
          notification_type: string;
          offer_id: string | null;
          recipient_clerk_user_id: string;
          recipient_is_owner: boolean;
        }[];
      };
      complete_auction_sale: {
        Args: { p_auction_id: string };
        Returns: string;
      };
      continue_with_next_auction_candidate: {
        Args: { p_auction_id: string };
        Returns: string;
      };
      get_my_auction_result_offers: {
        Args: Record<PropertyKey, never>;
        Returns: {
          accepted_at: string | null;
          amount_minor: number;
          auction_id: string;
          currency: string;
          expires_at: string;
          finalization_status: string;
          issued_at: string;
          offer_id: string;
          offer_status: string;
          owner_clerk_user_id: string | null;
          owner_display_name: string | null;
          title: string;
        }[];
      };
      get_owned_auction_finalization: {
        Args: { p_auction_id: string };
        Returns: {
          auction_id: string;
          closed_at: string | null;
          confirmed_amount_minor: number | null;
          confirmed_bidder_clerk_user_id: string | null;
          confirmed_bidder_display_name: string | null;
          confirmed_offer_id: string | null;
          currency: string;
          finalization_status: string;
          interest_confirmed_at: string | null;
          sale_completed_at: string | null;
          started_at: string;
          title: string;
        }[];
      };
      mark_notification_outbox_failed: {
        Args: {
          p_error_code: string;
          p_job_id: string;
          p_temporary: boolean;
        };
        Returns: string;
      };
      mark_notification_outbox_sent: {
        Args: { p_job_id: string; p_provider_message_id: string };
        Returns: boolean;
      };
      respond_to_auction_result_offer: {
        Args: { p_offer_id: string; p_response: string };
        Returns: string;
      };
      sync_current_profile: {
        Args: { p_display_name: string; p_preferred_locale: "en" | "sk" };
        Returns: {
          clerk_user_id: string;
          created_at: string;
          display_name: string | null;
          id: string;
          preferred_locale: "en" | "sk";
          updated_at: string;
        }[];
      };
      add_owned_auction_note: {
        Args: { p_auction_id: string; p_body: string };
        Returns: boolean;
      };
      delete_owned_active_auction: {
        Args: { p_auction_id: string };
        Returns: boolean;
      };
      get_public_auction: {
        Args: { p_auction_id: string };
        Returns: {
          currency: string;
          description: string;
          ends_at: string;
          id: string;
          location: string | null;
          bid_count: number;
          bid_history: { amount_minor: number; created_at: string }[];
          current_highest_minor: number | null;
          min_increment_minor: number;
          minimum_next_bid_minor: number;
          owner_notes: { body: string; created_at: string }[];
          photo_paths: string[];
          starting_price_minor: number;
          starts_at: string;
          title: string;
        }[];
      };
      get_owned_bid_summaries: {
        Args: Record<PropertyKey, never>;
        Returns: {
          auction_id: string;
          bid_count: number;
          current_highest_minor: number | null;
        }[];
      };
      get_my_bid_auctions: {
        Args: Record<PropertyKey, never>;
        Returns: {
          auction_id: string;
          currency: string;
          current_highest_minor: number;
          ends_at: string;
          location: string | null;
          my_latest_amount_minor: number;
          my_latest_bid_at: string;
          photo_path: string | null;
          status: string;
          title: string;
        }[];
      };
      place_bid: {
        Args: {
          p_amount_minor: number;
          p_auction_id: string;
          p_request_id: string;
        };
        Returns: {
          accepted_amount_minor: number | null;
          accepted_at: string | null;
          bid_count: number;
          bid_id: string | null;
          current_highest_minor: number | null;
          minimum_next_bid_minor: number | null;
          status: string;
        }[];
      };
      update_owned_active_auction: {
        Args: {
          p_auction_id: string;
          p_description: string;
          p_ends_at: string;
          p_location: string;
          p_min_increment_minor: number;
          p_starting_price_minor: number;
          p_title: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
