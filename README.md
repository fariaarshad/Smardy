# ⚡ Smardy AI

**Write offline. Go viral online.**

Smardy AI is a hybrid AI copywriting and viral hook studio built for creators and e-commerce sellers. It combines **On-Device AI** (running privately inside Google Chrome with zero internet) and **Cloud AI** (for high-impact marketing angles) using **Firebase AI Logic**.

---

## ✨ Key Features

- **🧠 Instant Offline Draft Cleanup (`PREFER_ON_DEVICE`):** Removes filler words and polishes messy product descriptions or video scripts directly inside Chrome using Gemini Nano—even when Wi-Fi is completely off.
- **🚀 Viral Marketing Hook Generator (`PREFER_IN_CLOUD`):** Generates 3 scroll-stopping marketing hooks (Contrarian, Curiosity Gap, and Pain-Point) powered by Google's Cloud Gemini models.
- **🔒 Private Saved Hooks (Firestore + Anonymous Auth):** Silently signs users in with Firebase Anonymous Authentication so every visitor gets their own private, persistent list of saved hooks.
- **🛡️ Protected with Firebase App Check:** Secures AI and database requests against unauthorized traffic.

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **AI Orchestration:** Firebase AI Logic (`firebase/ai` with `GoogleAIBackend`)
- **Database & Auth:** Cloud Firestore & Firebase Anonymous Authentication
- **Security:** Firebase App Check

---

## 🚀 How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   cd smardy-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory and add your Firebase project credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Enable Chrome On-Device AI (for offline mode):**
   - Open Chrome (`chrome://flags`) and ensure on-device optimization / Prompt API is enabled.

5. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## 📄 License

This project is licensed under the MIT License.
