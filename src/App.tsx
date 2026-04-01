import { useState, useEffect } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import MessagesPage from "./pages/Messages";
import type { AppUser } from "./lib/types";

const demoUsers: AppUser[] = [
  { id: "11111111-1111-1111-1111-111111111111", fullName: "Sam Student", email: "sam@aloe.app", role: "student" },
  { id: "22222222-2222-2222-2222-222222222222", fullName: "Taylor Teacher", email: "taylor@aloe.app", role: "teacher" },
  { id: "33333333-3333-3333-3333-333333333333", fullName: "Casey Coach", email: "casey@aloe.app", role: "coach" },
];

const currentUser = demoUsers[0];

function Win2kClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="win-taskbar-clock" aria-label="System clock">
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </div>
  );
}

function WindowChrome({ title, icon = "🌿", children }: { title: string; icon?: string; children: React.ReactNode }) {
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
        <span className="win-menu-item" role="menuitem">View</span>
        <span className="win-menu-item" role="menuitem">Help</span>
      </div>
      {children}
    </div>
  );
}

function HomePage() {
  return (
    <WindowChrome title="Aloe — Home">
      <div className="win-toolbar">
        <Link href="/" className="win-btn" style={{ textDecoration: "none" }}>🏠 Home</Link>
        <div className="win-toolbar-sep" aria-hidden="true" />
        <Link href="/messages" className="win-btn" style={{ textDecoration: "none" }}>✉ Messages</Link>
      </div>
      <div className="win-client">
        <div className="win-home-content">
          <h2>Welcome to Aloe 🌿</h2>
          <p>
            This is your Aloe starter application. Use the navigation above to explore the
            messaging feature connecting students, teachers, and coaches.
          </p>
          <div className="win-groupbox">
            <span className="win-groupbox-label">Quick Links</span>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Link href="/messages">
                <button className="win-btn win-btn-default">✉ Open Messages</button>
              </Link>
            </div>
          </div>
          <div className="win-groupbox">
            <span className="win-groupbox-label">Current User</span>
            <div style={{ padding: "4px 0", fontSize: 11, lineHeight: 1.6 }}>
              <strong>Name:</strong> {currentUser.fullName}<br />
              <strong>Email:</strong> {currentUser.email}<br />
              <strong>Role:</strong> {currentUser.role}
            </div>
          </div>
        </div>
      </div>
      <div className="win-statusbar">
        <div className="win-status-pane">Ready</div>
        <div className="win-status-pane" style={{ maxWidth: 120 }}>Aloe v1.0</div>
      </div>
    </WindowChrome>
  );
}

export default function App() {
  const [location] = useLocation();

  const pageTitle =
    location === "/messages" ? "Aloe — Messages" : "Aloe — Home";

  return (
    <div className="win-desktop">
      <main style={{ width: "100%", maxWidth: 680, marginTop: 8 }}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/messages">
            <MessagesPage currentUser={currentUser} users={demoUsers} />
          </Route>
          <Route>
            <WindowChrome title="Aloe — Error">
              <div className="win-client">
                <div className="win-alert" role="alert">
                  <span style={{ fontSize: 24 }}>⚠️</span>
                  <div>
                    <strong>Page Not Found</strong><br />
                    The requested page could not be found.
                    <br />
                    <Link href="/"><button className="win-btn" style={{ marginTop: 8 }}>OK</button></Link>
                  </div>
                </div>
              </div>
            </WindowChrome>
          </Route>
        </Switch>
      </main>

      {/* Taskbar */}
      <div className="win-taskbar" role="toolbar" aria-label="Taskbar">
        <button className="win-start-btn" aria-label="Start menu">
          <div className="win-start-icon" aria-hidden="true" />
          Start
        </button>
        <div className="win-taskbar-sep" aria-hidden="true" />
        <Link href="/">
          <button className="win-btn" style={{ fontSize: 11, height: 22 }}>🏠 Aloe Home</button>
        </Link>
        <Link href="/messages">
          <button className="win-btn" style={{ fontSize: 11, height: 22 }}>✉ Messages</button>
        </Link>
        <Win2kClock />
      </div>
    </div>
  );
}
