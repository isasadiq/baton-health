# Baton — Closed-Loop Screening-to-Care Tracker

> **Every worrying screening result becomes a "Loop" that behaves like a baton in a relay race:**
> - **One owner at all times.** A handoff only counts when the next person accepts it.
> - **One clock.** If nobody acts in time, the case turns red and escalates to a human coordinator.
> - **No closing without proof.** A case can only be closed with documented evidence and a named clinician's sign-off.

---

## 🏃 Features & Actor Views

### 1. Health Staff ("Case Board")
- **Lane Kanban View**: Live stage columns (`ISSUED`, `NOTIFIED`, `ACKNOWLEDGED`, `REFERRED`, `ACCEPTED`, `APPOINTMENT`, `IN CARE`, `CLOSED`).
- **One Clock SLA Engine**: Visual countdowns color-coded by urgency (`Routine`, `Priority`, `Urgent`).
- **Status Filter**: On track (🟢), At risk / Patient barrier (🟡), Overdue / Escalated (🔴), Documented Closed (⚪).
- **Relay Audit Ledger**: Append-only transition history (`transitions` table) and specialist referral attempt tracking (`referral_attempts` table).

### 2. Patient Edge ("Calm Check-in")
- **Encrypted, Respectful Notification**: Accessible via secure magic link or mobile preview. Never displays scary raw numbers or medical jargon over unencrypted channels.
- **Two Simple Pathways**:
  1. *"I understand — please guide me to an appointment"*
  2. *"Something is stopping me..."* (Cost 💸, Transport 🚗, Fear / Anxiety 😟, Work hours ⏰, Confusion ❓).
- **Real Resource Matching**: Dynamically displays matching community assistance from the site directory (e.g., subsidised follow-up, transit stipend, nurse callback within 4h, evening clinic slots).

### 3. Clinician 1-Tap Referral Card
- **Frictionless Zero-Login Action**: Receiving specialists accept or decline with 1 tap.
- **Auto-Reroute on Decline / Timeout**: If a clinic declines (requires a reason) or times out, the baton automatically transfers to the next specialist clinic in priority order.

### 4. Programme Leaders ("Metrics & Accountability")
- Real measures computed directly from case transition milestones (`v_metrics_summary`):
  - Avg Hours to Notify, Acknowledge, Appointment, and Close.
  - Drop-off and barrier reasons breakdown (`v_dropoff_reasons`).

---

## 🛠️ Database Schema & Rules
- `01_schema.sql` & `02_seed.sql` included in `/supabase`.
- State machine enforced with strict transition rules and closure evidence checks.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
```

---

## 🌐 Deploy to Vercel or Netlify

1. Push this directory to GitHub.
2. Import repository in [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
3. Framework Preset: **Vite**. Build Command: `npm run build`. Output Directory: `dist`.
