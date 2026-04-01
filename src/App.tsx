import { Link, Route, Switch } from "wouter";
import MessagesPage from "./pages/Messages";
import type { AppUser } from "./lib/types";

const demoUsers: AppUser[] = [
  { id: "11111111-1111-1111-1111-111111111111", fullName: "Sam Student", email: "sam@aloe.app", role: "student" },
  { id: "22222222-2222-2222-2222-222222222222", fullName: "Taylor Teacher", email: "taylor@aloe.app", role: "teacher" },
  { id: "33333333-3333-3333-3333-333333333333", fullName: "Casey Coach", email: "casey@aloe.app", role: "coach" },
];

const currentUser = demoUsers[0];

function HomePage() {
  return (
    <main>
      <h1>Aloe 🌿</h1>
      <p>This is your starter app. Click Messages to test the new messaging screen.</p>
      <Link href="/messages">Go to Messages</Link>
    </main>
  );
}

export default function App() {
  return (
    <>
      <nav>
        <Link href="/">Home</Link> | <Link href="/messages">Messages</Link>
      </nav>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/messages">
          <MessagesPage currentUser={currentUser} users={demoUsers} />
        </Route>
        <Route>Page not found</Route>
      </Switch>
    </>
  );
}
