import { getSupabaseClient } from "./supabaseClient";
import { supabase } from "./supabaseClient";
import type { AppUser, DirectMessage } from "./types";

interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  sender_profile?: { id: string; full_name: string; role: AppUser["role"] } | null;
  recipient_profile?: { id: string; full_name: string; role: AppUser["role"] } | null;
}

function mapMessage(row: MessageRow): DirectMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body,
    createdAt: row.created_at,
    sender: row.sender_profile
      ? {
          id: row.sender_profile.id,
          fullName: row.sender_profile.full_name,
          role: row.sender_profile.role,
        }
      : undefined,
    recipient: row.recipient_profile
      ? {
          id: row.recipient_profile.id,
          fullName: row.recipient_profile.full_name,
          role: row.recipient_profile.role,
        }
      : undefined,
  };
}

export async function fetchConversation(currentUserId: string, otherUserId: string): Promise<DirectMessage[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      sender_id,
      recipient_id,
      body,
      created_at,
      sender_profile:profiles!messages_sender_id_fkey(id, full_name, role),
      recipient_profile:profiles!messages_recipient_id_fkey(id, full_name, role)
    `,
    )
    .or(
      `and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`,
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (error) {
    throw error;
  }

  return (data as MessageRow[]).map(mapMessage);
}

export async function sendDirectMessage(senderId: string, recipientId: string, body: string): Promise<DirectMessage> {
  const supabase = getSupabaseClient();
  const cleanBody = body.trim();
  if (!cleanBody) throw new Error("Message cannot be empty.");

  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: senderId, recipient_id: recipientId, body: cleanBody })
  const cleanBody = body.trim();

  if (!cleanBody) {
    throw new Error("Message cannot be empty.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      body: cleanBody,
    })
    .select(
      `
      id,
      sender_id,
      recipient_id,
      body,
      created_at,
      sender_profile:profiles!messages_sender_id_fkey(id, full_name, role),
      recipient_profile:profiles!messages_recipient_id_fkey(id, full_name, role)
    `,
    )
    .single();

  if (error) throw error;
  if (error) {
    throw error;
  }

  return mapMessage(data as MessageRow);
}

export function subscribeToMessages(
  currentUserId: string,
  otherUserId: string,
  onNewMessage: (message: DirectMessage) => void,
) {
  const supabase = getSupabaseClient();

  const channel = supabase
    .channel(`conversation:${currentUserId}:${otherUserId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId}))`,
      },
      (payload) => {
        const row = payload.new as {
          id: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          created_at: string;
        };

        const inConversation =
          (row.sender_id === currentUserId && row.recipient_id === otherUserId) ||
          (row.sender_id === otherUserId && row.recipient_id === currentUserId);

        if (!inConversation) return;

        onNewMessage({
          id: row.id,
          senderId: row.sender_id,
          recipientId: row.recipient_id,
          body: row.body,
          createdAt: row.created_at,
        });
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
