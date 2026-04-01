import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { fetchConversation, sendDirectMessage, subscribeToMessages } from "../lib/messages";
import type { AppUser, DirectMessage } from "../lib/types";

interface MessagesPageProps {
  currentUser: AppUser;
  users: AppUser[];
}

function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function WindowChrome({ title, icon = "✉", children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <div className="win-window" role="region" aria-label={title}>
      {/* Title bar */}
      <div className="win-titlebar">
        <div className="win-titlebar-icon" aria-hidden="true">{icon}</div>
        <span className="win-titlebar-text">{title}</span>
        <div className="win-titlebar-controls" aria-hidden="true">
          <button className="win-titlebar-btn" title="Minimize">_</button>
          <button className="win-titlebar-btn" title="Maximize">□</button>
          <button className="win-titlebar-btn close" title="Close">✕</button>
        </div>
      </div>
      {/* Menu bar */}
      <div className="win-menubar" role="menubar">
        <span className="win-menu-item" role="menuitem">File</span>
        <span className="win-menu-item" role="menuitem">Edit</span>
        <span className="win-menu-item active" role="menuitem">View</span>
        <span className="win-menu-item" role="menuitem">Actions</span>
        <span className="win-menu-item" role="menuitem">Help</span>
      </div>
      {children}
    </div>
  );
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
    if (!selectedUserId || !draft.trim()) return;

    try {
      const sent = await sendDirectMessage(currentUser.id, selectedUserId, draft);
      setMessages((prev) => [...prev, sent]);
      setDraft("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message.";
      setError(message);
    }
  }

  const selectedRecipient = availableRecipients.find((u) => u.id === selectedUserId);

  const chatTitle = selectedRecipient
    ? `Conversation with ${selectedRecipient.fullName}`
    : "Select a Contact";

  return (
    <WindowChrome title={`Aloe Messages — ${currentUser.fullName}`}>
      {/* Toolbar */}
      <div className="win-toolbar">
        <Link href="/">
          <button className="win-btn" title="Go back to Home">← Back</button>
        </Link>
        <div className="win-toolbar-sep" aria-hidden="true" />
        <button className="win-btn" onClick={() => setMessages([])} title="Clear messages">
          🗑 Clear
        </button>
        <div className="win-toolbar-sep" aria-hidden="true" />
        <span className="win-label" style={{ paddingLeft: 4 }}>
          Signed in as: <strong>{currentUser.fullName}</strong> ({currentUser.role})
        </span>
      </div>

      {/* Main split pane */}
      <div className="win-pane-layout">
        {/* Sidebar — contact list */}
        <aside className="win-sidebar" aria-label="Contacts">
          <div className="win-sidebar-header">Contacts</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {availableRecipients.map((user) => (
              <li key={user.id}>
                <button
                  className={`win-contact-item${selectedUserId === user.id ? " selected" : ""}`}
                  style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer", font: "inherit" }}
                  onClick={() => setSelectedUserId(user.id)}
                  aria-pressed={selectedUserId === user.id}
                  aria-label={`Chat with ${user.fullName}`}
                >
                  <div className="win-contact-avatar" aria-hidden="true">
                    {getInitials(user.fullName)}
                  </div>
                  <div className="win-contact-label">
                    <div>{user.fullName}</div>
                    <div className="win-contact-role">{user.role}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Chat panel */}
        <div className="win-chat-area">
          {/* Chat header */}
          <div
            style={{
              background: "#e8e4dc",
              borderBottom: "1px solid #808080",
              padding: "3px 8px",
              fontSize: 11,
              fontWeight: "bold",
              color: "#0a246a",
            }}
          >
            {chatTitle}
          </div>

          {/* Error banner */}
          {error && (
            <div className="win-alert" role="alert">
              <span style={{ fontSize: 18 }} aria-hidden="true">⚠</span>
              <span>{error}</span>
              <button className="win-btn" onClick={() => setError(null)} style={{ marginLeft: "auto" }}>
                OK
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="win-chat-messages" aria-live="polite" aria-label="Messages">
            {isLoading ? (
              <div className="win-loading">
                <span aria-live="polite">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="win-loading">No messages yet. Say hello!</div>
            ) : (
              messages.map((message) => {
                const isMe = message.senderId === currentUser.id;
                const senderName = isMe ? "You" : (message.sender?.fullName ?? "User");
                return (
                  <div
                    key={message.id}
                    className={`win-message${isMe ? " win-message-me" : ""}`}
                  >
                    <div
                      className="win-message-avatar"
                      aria-hidden="true"
                      title={senderName}
                      style={{
                        background: isMe ? "#cce8ff" : "#d4d0c8",
                        borderColor: isMe ? "#7ab3e0" : "#808080",
                      }}
                    >
                      {getInitials(senderName === "You" ? currentUser.fullName : senderName)}
                    </div>
                    <div className="win-message-bubble">
                      <span className="win-message-sender">{senderName}</span>
                      {message.body}
                      <span className="win-message-time">{formatTimestamp(message.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Compose */}
          <form className="win-compose" onSubmit={handleSubmit} aria-label="Send a message">
            <label htmlFor="draft" className="sr-only">Message</label>
            <input
              id="draft"
              className="win-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message here..."
              disabled={!selectedUserId || isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              className="win-btn win-btn-default"
              disabled={!selectedUserId || !draft.trim() || isLoading}
            >
              Send ➤
            </button>
          </form>
        </div>
      </div>

      {/* Status bar */}
      <div className="win-statusbar" role="status" aria-label="Status bar">
        <div className="win-status-pane">
          {isLoading ? "Loading…" : `${messages.length} message${messages.length !== 1 ? "s" : ""}`}
        </div>
        <div className="win-status-pane" style={{ maxWidth: 160 }}>
          {selectedRecipient ? `To: ${selectedRecipient.fullName}` : "No recipient selected"}
        </div>
        <div className="win-status-pane" style={{ maxWidth: 80 }}>Aloe v1.0</div>
      </div>
    </WindowChrome>
  );
}
