import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchConversation, sendDirectMessage, subscribeToMessages } from "../lib/messages";
import type { AppUser, DirectMessage } from "../lib/types";

interface MessagesPageProps {
  currentUser: AppUser;
  users: AppUser[];
}

function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString();
}

export default function MessagesPage({ currentUser, users }: MessagesPageProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRecipients = useMemo(
    () => users.filter((user) => user.id !== currentUser.id),
    [currentUser.id, users],
  );

  useEffect(() => {
    if (!selectedUserId && availableRecipients.length > 0) {
      setSelectedUserId(availableRecipients[0].id);
    }
  }, [availableRecipients, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;

    setIsLoading(true);
    setError(null);

    fetchConversation(currentUser.id, selectedUserId)
      .then(setMessages)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));

    const unsubscribe = subscribeToMessages(currentUser.id, selectedUserId, (incoming) => {
      setMessages((prev) => [...prev, incoming]);
    });

    return unsubscribe;
  }, [currentUser.id, selectedUserId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUserId) return;

    try {
      const sent = await sendDirectMessage(currentUser.id, selectedUserId, draft);
      setMessages((prev) => [...prev, sent]);
      setDraft("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message.";
      setError(message);
    }
  }

  return (
    <section>
      <h1>Messages</h1>

      <label htmlFor="recipient">Chat with:</label>
      <select
        id="recipient"
        value={selectedUserId}
        onChange={(event) => setSelectedUserId(event.target.value)}
      >
        {availableRecipients.map((user) => (
          <option key={user.id} value={user.id}>
            {user.fullName} ({user.role})
          </option>
        ))}
      </select>

      {error && <p role="alert">{error}</p>}
      {isLoading ? (
        <p>Loading messages...</p>
      ) : (
        <ul>
          {messages.map((message) => {
            const isMe = message.senderId === currentUser.id;
            return (
              <li key={message.id}>
                <strong>{isMe ? "You" : message.sender?.fullName ?? "User"}:</strong> {message.body}
                <small> — {formatTimestamp(message.createdAt)}</small>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message"
        />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
