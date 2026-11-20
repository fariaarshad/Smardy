// src/App.jsx
import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { cleanModel, hookModel, db, auth } from "./firebase";
import "./App.css";

// Reads which AI answered: "ON_DEVICE" or "IN_CLOUD"
function detectSource(result) {
  const raw = String(result?.response?.inferenceSource ?? "").toUpperCase();
  return raw.includes("ON_DEVICE") || raw.includes("ON-DEVICE") ? "device" : "cloud";
}

function Badge({ source }) {
  if (!source) return null;
  const isDevice = source === "device";
  return (
    <span className={`badge ${isDevice ? "badge-device" : "badge-cloud"}`}>
      {isDevice ? "⚡ On-Device AI (Offline Ready)" : "☁️ Cloud AI"}
    </span>
  );
}

// Turns the AI's reply into a list of 3 hooks, even if it adds extra characters
function parseHooks(text) {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    const arr = JSON.parse(cleaned.slice(start, end + 1));
    return arr
      .filter((h) => h && h.hook)
      .map((h) => ({ angle: h.angle || "Hook", text: h.hook }));
  } catch {
    return [{ angle: "Hook", text: text.trim() }];
  }
}

export default function App() {
  const [draft, setDraft] = useState("");
  const [cleanSource, setCleanSource] = useState(null);
  const [hooksSource, setHooksSource] = useState(null);
  const [hooks, setHooks] = useState([]);
  const [saved, setSaved] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Silent sign-in: no login screen. If the visitor already has an anonymous
  // account (saved in their browser), it is reused; otherwise a new one is made.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth).catch((e) =>
          setError("Could not start your private session: " + e.message)
        );
      }
    });
    return unsub;
  }, []);

  // Live list of THIS user's saved hooks only
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "hooks"), where("userId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Newest first (sorted here, so no Firestore index is needed)
        list.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? Date.now();
          const tb = b.createdAt?.toMillis?.() ?? Date.now();
          return tb - ta;
        });
        setSaved(list);
      },
      (err) => setError("Could not load saved hooks: " + err.message)
    );
    return unsub;
  }, [user]);

  async function handleClean() {
    if (!draft.trim()) return setError("Please paste some text first.");
    setError("");
    setBusy("clean");
    try {
      const prompt =
        "Tighten and clean the following draft. Remove filler words (like um, uh, like, " +
        "basically, you know, really, just), fix grammar, and polish it so it is clear and punchy. " +
        "Keep the original meaning. Return ONLY the improved text, nothing else.\n\n" +
        draft;
      const result = await cleanModel.generateContent(prompt);
      setDraft(result.response.text().trim());
      setCleanSource(detectSource(result));
    } catch (e) {
      setError("Clean-up failed: " + e.message);
    } finally {
      setBusy("");
    }
  }

  async function handleHooks() {
    if (!draft.trim()) return setError("Please paste some text first.");
    setError("");
    setBusy("hooks");
    try {
      const prompt =
        "You are a viral marketing copywriter. Based on the product or script below, write exactly 3 " +
        "short, scroll-stopping marketing hooks, one for each angle: Contrarian, Curiosity Gap, Pain-Point. " +
        'Reply ONLY with a JSON array like [{"angle":"Contrarian","hook":"..."},' +
        '{"angle":"Curiosity Gap","hook":"..."},{"angle":"Pain-Point","hook":"..."}].\n\n' +
        draft;
      const result = await hookModel.generateContent(prompt);
      setHooks(parseHooks(result.response.text()));
      setHooksSource(detectSource(result));
    } catch (e) {
      setError("Hook generation failed: " + e.message);
    } finally {
      setBusy("");
    }
  }

  async function saveHook(hook) {
    if (!user) {
      return setError("Still connecting your private session. Try again in a second.");
    }
    try {
      await addDoc(collection(db, "hooks"), {
        angle: hook.angle,
        text: hook.text,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      setError("Could not save: " + e.message);
    }
  }

  async function removeHook(id) {
    try {
      await deleteDoc(doc(db, "hooks", id));
    } catch (e) {
      setError("Could not delete: " + e.message);
    }
  }

  return (
    <div className="page">
      <header>
        <h1>Smardy <span>AI</span></h1>
        <p>Write offline. Go viral online.</p>
      </header>

      <section className="card">
        <label htmlFor="draft">Your product description or video script</label>
        <textarea
          id="draft"
          rows={8}
          placeholder="Paste your messy draft here…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="row">
          <button onClick={handleClean} disabled={!!busy}>
            {busy === "clean" ? "Cleaning…" : "✨ Tighten & Clean Draft"}
          </button>
          <Badge source={cleanSource} />
        </div>
      </section>

      <section className="card">
        <div className="row">
          <button className="primary" onClick={handleHooks} disabled={!!busy}>
            {busy === "hooks" ? "Generating…" : "🚀 Generate 3 Viral Marketing Hooks"}
          </button>
          <Badge source={hooksSource} />
        </div>

        {hooks.length > 0 && (
          <ul className="hooks">
            {hooks.map((h, i) => (
              <li key={i}>
                <strong>{h.angle}</strong>
                <p>{h.text}</p>
                <button className="small" onClick={() => saveHook(h)}>💾 Save Hook</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <div className="error">{error}</div>}

      <section className="card">
        <h2>⭐ Saved Hooks</h2>
        {saved.length === 0 && <p className="muted">Nothing saved yet.</p>}
        <ul className="hooks">
          {saved.map((h) => (
            <li key={h.id}>
              <strong>{h.angle}</strong>
              <p>{h.text}</p>
              <button className="small danger" onClick={() => removeHook(h.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <footer className="footer">
        <p className="footer-credit">
          Built with curiosity &amp; love by <strong>Faria</strong> 💛
        </p>
        <div className="footer-links">
          <a
            className="pill pill-linkedin"
            href="https://www.linkedin.com/in/faria-arshad651"
            target="_blank"
            rel="noopener noreferrer"
          >
            💼 LinkedIn
          </a>
          <a
            className="pill pill-instagram"
            href="https://www.instagram.com/fariaarshadd?utm_source=ig_web_button_share_sheet&dmpr=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
          >
            📸 Instagram
          </a>
          <a
            className="pill pill-x"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
          >
            ✖️ X
          </a>
        </div>
      </footer>
    </div>
  );
}