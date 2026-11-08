/**
 * Hand-written schema types matching `supabase/migrations/0001_init.sql`.
 * In the next stage these should be replaced by `supabase gen types typescript`
 * output so they can never drift from the database.
 *
 * PostgREST serialises `vector` columns as strings, so embeddings are typed as
 * `string | null` here; vector search will be exposed through an RPC function
 * rather than a direct column comparison.
 */

type Timestamps = {
  created_at: string;
  updated_at: string;
};

type Relationships = [];

export interface ProfileRow extends Timestamps {
  id: string;
  display_name: string | null;
}

export interface ConversationRow extends Timestamps {
  id: string;
  user_id: string;
  title: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  token_count: number | null;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  user_id: string;
  title: string;
  source_uri: string | null;
  mime_type: string | null;
  created_at: string;
}

export interface DocumentChunkRow {
  id: string;
  document_id: string;
  user_id: string;
  chunk_index: number;
  content: string;
  embedding: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: { id: string; display_name?: string | null };
        Update: { display_name?: string | null };
        Relationships: Relationships;
      };
      conversations: {
        Row: ConversationRow;
        Insert: { id?: string; user_id: string; title: string };
        Update: { title?: string };
        Relationships: Relationships;
      };
      messages: {
        Row: MessageRow;
        Insert: {
          id?: string;
          conversation_id: string;
          role: MessageRow["role"];
          content: string;
          token_count?: number | null;
        };
        Update: { content?: string; token_count?: number | null };
        Relationships: Relationships;
      };
      documents: {
        Row: DocumentRow;
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          source_uri?: string | null;
          mime_type?: string | null;
        };
        Update: { title?: string; source_uri?: string | null };
        Relationships: Relationships;
      };
      document_chunks: {
        Row: DocumentChunkRow;
        Insert: {
          id?: string;
          document_id: string;
          user_id: string;
          chunk_index: number;
          content: string;
          embedding?: string | null;
        };
        Update: { content?: string; embedding?: string | null };
        Relationships: Relationships;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
