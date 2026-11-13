export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          clerk_user_id: string;
          created_at: string;
          id: string;
        };
        Insert: {
          clerk_user_id: string;
          created_at?: string;
          id?: string;
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
