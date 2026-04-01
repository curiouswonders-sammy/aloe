import { getSupabaseClient } from "./supabaseClient";
import type { AppUser, DirectMessage } from "./types";

type ProfileShape = { id: string; full_name: string; role: AppUser["role"] };

type MaybeProfile = ProfileShape | ProfileShape[] | null | undefined;

interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  sender_profile?: MaybeProfile;
  recipient_profile?: MaybeProfile;
}

function normalizeProfile(profile: MaybeProfile): ProfileShape | undefined {
  if (!profile) return undefined;
  if (Array.isArray(profile)) return profile[0];
  return profile;
}

function mapMessage(row: MessageRow): DirectMessage {
  const sender = normalizeProfile(row.sender_profile);
  const recipient = normalizeProfile(row.recipient_profile);

  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body,
    createdAt: row.created_at,
    sender: sender
      ? {
          id: sender.id,
          fullName: sender.full_name,
          role: sender.role,
        }
      : undefined,
    recipient: recipient
      ? {
          id: recipient.id,
          fullName: recipient.full_name,
          role: recipient.role,
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

  const rows = (data ?? []) as unknown as MessageRow[];
  return rows.map(mapMessage);
}

export async function sendDirectMessage(senderId: string, recipientId: string, body: string): Promise<DirectMessage> {
  const supabase = getSupabaseClient();
  const cleanBody = body.trim();

  if (!cleanBody) {
    throw new Error("Message cannot be empty.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: senderId, recipient_id: recipientId, body: cleanBody })
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
  if (!data) throw new Error("Message was inserted but no row was returned.");

  return mapMessage(data as unknown as MessageRow);
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
