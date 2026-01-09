# Build Plan: Mobile-First “Finance Terms Presentation” Page with Liveblocks

## 0) Outcome (what we are building)
A single, high-value, mobile-first web page that feels like a native app, used while you’re on the phone with a customer.

**Flow:**
1. You call customer: “Are you around?”
2. You text them a **unique link** (magic link / session link).
3. Customer opens link → **lightweight verification** (“last 4 of SSN” UX) → enters it.
4. Customer sees **their specific approval** for a tow truck:
   - Product card (image + key details)
   - Finance terms panel with sliders and toggles:
     - payment slider (real-time)
     - down payment input
     - term length selector
     - optional balloon
     - payoff options
5. While on the phone, **you (rep)** join the same session and use Liveblocks to:
   - guide the screen (spotlight / highlight elements)
   - move/advance a “presentation step” or “mode”
   - optionally lock/unlock controls
6. Customer picks terms (or confirms on the phone)
7. “Next” leads to **closing docs + e-sign** (separate page/flow, but wired in).

**Non-negotiables:**
- Fast, minimal friction on mobile
- Flawless visuals + micro-interactions
- Secure access (link + verification) without exposing sensitive data
- Real-time guided experience controlled by rep

---

## 1) Key Security + Compliance Rules (design constraints)
### 1.1 Do NOT store SSN last-4 in plain form
- Treat “last 4” as a **verification factor** only.
- Store only a **salted hash** of the last-4 (or better: store a hash already provided by your CRM/LOS).
- Never log it. Never send it to analytics. Never display it back.

### 1.2 Use “session link + verification” (2-step)
- Session link: `https://app.yourdomain.com/a/<sessionToken>`
- Customer must also enter last-4 to unlock.
- SessionToken is:
  - random, long, single-use (or short-lived multi-use)
  - tied to a specific approval record
  - expires fast (e.g., 30–60 minutes)
- Rate limit verification attempts per session (e.g., 5 tries → lock).

### 1.3 Roles and permissions
- **Customer:** can view and interact (if allowed).
- **Rep:** can control presentation (spotlight, step changes, lock/unlock).
- Liveblocks room auth must enforce:
  - customer can’t become rep
  - only rep can broadcast control events (spotlight, step changes)

### 1.4 Auditability
Store an audit trail:
- session created, opened, verified
- rep joined/left
- customer chosen terms + timestamp
- document generation trigger

---

## 2) Recommended Tech Stack (pick one and commit)
### Option A (recommended): Next.js + Liveblocks + Tailwind
- Next.js (App Router)
- Liveblocks for real-time presence + broadcast events
- Tailwind CSS for app-like polish
- Server actions / API routes for token verification + room auth
- Postgres (or managed DB) for approvals/sessions/audit

### Option B: React SPA + Node/Express + Liveblocks
- Similar, but Next.js is cleaner for auth + server logic.

---

## 3) Data Model (minimal but complete)
### 3.1 Approval
- `approval_id` (uuid)
- `customer_id`
- `vehicle_id`
- `approval_amount`
- `apr` (or rate table)
- `min_down_payment`, `max_term`, `allowed_terms[]`
- `allowed_balloon` (bool + constraints)
- `created_at`, `expires_at`
- `status` (approved/expired/etc)

### 3.2 Vehicle (tow truck)
- `vehicle_id`
- `title`, `year`, `make`, `model`
- `image_url`
- `price`
- `vin` (optional / hidden by default)

### 3.3 Session (the link you text)
- `session_id` (uuid)
- `session_token_hash` (hash of token)
- `approval_id`
- `customer_last4_hash` (salted hash)
- `expires_at`
- `max_attempts`, `attempt_count`
- `verified_at` (nullable)
- `created_by_rep_id`
- `status` (active/locked/expired/used)

### 3.4 Term Selection (what customer chooses)
- `selection_id`
- `session_id`
- `term_months`
- `down_payment`
- `balloon_amount` (nullable)
- `payment_frequency` (monthly/biweekly if you support)
- `estimated_payment`
- `total_of_payments`, `total_interest` (optional)
- `chosen_at`

### 3.5 Audit Events
- `event_id`
- `session_id`
- `actor` (customer/rep/system)
- `type` (opened, verified, rep_joined, spotlight_changed, terms_changed, terms_confirmed)
- `payload` (json)
- `created_at`

---

## 4) Calculations Engine (finance terms that update instantly)
### 4.1 Inputs (controlled by UI)
- Price (vehicle price)
- Taxes/fees (optional: show simplified view, with “Details” expand)
- Down payment
- APR
- Term months
- Balloon amount (optional)
- Any backend constraints (min/max ranges)

### 4.2 Outputs
- Monthly payment (primary)
- Due at signing (down payment + fees)
- Total of payments
- Total interest
- Payoff options (e.g., early payoff estimate or schedule view)
- “Balloon due” if balloon is enabled

### 4.3 Implementation rule
- Do calculations **client-side** for responsiveness.
- Server validates final selection before generating docs.

### 4.4 Balloon payment logic
Use standard amortization with residual/balloon:
- If balloon exists, payment is computed so remaining balance at end equals balloon amount.
- Validate balloon constraints (min/max).

---

## 5) UX / UI Requirements (must feel like an app)
### 5.1 Layout (mobile-first)
- Top: sticky header with:
  - approval badge (“Approved up to $X”)
  - subtle connection status indicator (Liveblocks)
- Body:
  1. **Vehicle Card** (image + model + price)
  2. **Payment Panel** (big number + slider)
  3. **Terms Controls** (down payment, term length, balloon toggle)
  4. **Details Drawer** (fees, APR details, amortization preview)
  5. **Confirm Terms** button (sticky bottom CTA)

### 5.2 Interaction polish
- Sliders: haptic-like animation (visual only), snap points, big touch targets
- Inputs: numeric keypad, currency formatting, inline validation
- Microcopy: short, confidence-building, no clutter
- Loading: skeleton screens, never show blank states
- Errors: friendly, minimal, and actionable

### 5.3 Accessibility + clarity
- Large fonts, high contrast
- One primary action at a time
- Avoid showing sensitive identifiers (no full SSN, no full VIN unless needed)

---

## 6) Liveblocks: What “Rep Control” Actually Means
### 6.1 Real-time features to implement (MVP -> advanced)
**MVP (must-have):**
- Presence: show “Ben (Rep) is viewing with you” to customer
- Spotlight: rep can highlight a component (payment slider, down payment, balloon toggle)
- Step mode: rep can switch the customer page between “views”:
  - Step 1: Congrats + approval summary
  - Step 2: Payment slider focus
  - Step 3: Down payment focus
  - Step 4: Balloon explanation (if allowed)
  - Step 5: Confirm terms

**Nice-to-have:**
- Rep can temporarily “lock” customer controls while explaining
- Rep can push a “recommended option” that animates the controls to that state
- “Follow me” mode: customer viewport scrolls to the highlighted section (use gently)

### 6.2 Liveblocks room design
Room ID: `approval:<approval_id>:session:<session_id>`

State channels:
- **Presence** (who’s here)
- **Broadcast events** (spotlight changes, step changes, lock/unlock)
- Optional: shared storage (recommended terms), but keep it minimal

**Authority rule:**
- Only `role=rep` can emit control events that affect the customer UI.

---

## 7) Page/Route Structure
### 7.1 Customer routes
1. `GET /a/[token]`  
   - shows verification screen (enter last 4)
2. `POST /api/verify`  
   - verifies token + last4, returns short-lived session auth
3. `GET /a/[token]/terms`  
   - main finance terms page
4. `POST /api/terms/confirm`  
   - saves selection + returns “next step” URL (closing docs)

### 7.2 Rep routes (internal)
1. `GET /rep/session/[session_id]`  
   - same room, with rep controls panel
2. `POST /api/session/create`  
   - create session + returns SMS-ready link
3. `POST /api/liveblocks/auth`  
   - server-authorized Liveblocks access token based on role

---

## 8) Detailed Step-by-Step Build Plan (do in this order)

### Step 1 — Foundation
- Create Next.js app (App Router)
- Add Tailwind + mobile-first design system
- Add a currency/number formatting utility
- Add a finance calculation module with unit tests

**Deliverable:** basic UI prototype that can compute payments locally.

---

### Step 2 — Data + Session Link Generation
- Implement DB schema (Approval, Vehicle, Session, AuditEvents, TermSelection)
- Create server endpoint: `POST /api/session/create`
  - input: `approval_id`, `customer_identifier`, `rep_id`
  - generate: `sessionToken` (random)
  - store: `hash(sessionToken)`
  - return: `https://.../a/<sessionToken>`

**Deliverable:** you can generate a link for a specific approval.

---

### Step 3 — Verification Screen (Last 4 UX)
- Build `GET /a/[token]` as verification UI:
  - 4 digit entry
  - “Continue” button
  - attempt counter hidden
- Implement `POST /api/verify`
  - verify token exists, not expired, not locked
  - compare hash(last4) to stored `customer_last4_hash`
  - increment attempts on failure
  - on success: mark `verified_at`, create a short-lived cookie/session JWT scoped to this approval/session
- Redirect to `/a/[token]/terms`

**Deliverable:** customer can unlock the approval page securely.

---

### Step 4 — Main Terms Page (Customer)
Build `/a/[token]/terms` with:
- Vehicle card (image + info)
- Payment summary (large, sticky)
- Controls:
  - term selector (segmented control)
  - down payment input + quick chips ($0 / $2k / $5k)
  - balloon toggle + slider/input (only if allowed)
  - payment slider (primary) that back-solves for down payment or term (choose ONE behavior)
- “Details” drawer for APR, fees, schedule preview
- Sticky bottom CTA: “Confirm these terms”

**Critical decision (pick one):**
- **Model A:** Customer adjusts down payment + term, payment updates.
- **Model B:** Customer adjusts payment slider, app derives term/down payment within constraints.
  
Recommend **Model A** first (less confusing, fewer edge cases).

**Deliverable:** customer can explore terms smoothly.

---

### Step 5 — Liveblocks Integration (Customer Presence + Rep Controls)
- Add Liveblocks
- Create `POST /api/liveblocks/auth`
  - Determine role by:
    - customer: verified session JWT
    - rep: authenticated internal user
  - Issue Liveblocks auth with room permissions
- On customer page:
  - connect to room
  - show presence indicator
  - subscribe to broadcast events:
    - `spotlight_target`
    - `presentation_step`
    - `controls_locked`
- Build rep control panel (separate route):
  - buttons for steps 1–5
  - spotlight selector (dropdown of UI sections)
  - lock/unlock toggle
  - “push recommendation” button (optional)

**Deliverable:** you can guide the customer’s screen in real time.

---

### Step 6 — Term Confirmation + Handoff to Closing
- `POST /api/terms/confirm`
  - validate selection against approval constraints server-side
  - store TermSelection
  - return next URL: `/closing/<session_id>` (or external doc-sign URL)
- UI:
  - show confirmation animation
  - provide “Continue to paperwork” button
  - optionally allow “Send me this summary” (SMS/email) as follow-up

**Deliverable:** user selection is saved and ready for doc generation.

---

### Step 7 — Performance, Polish, and Guardrails
- Preload vehicle image (optimized)
- Skeleton loaders
- Disable layout shifts
- Add offline/poor-network handling:
  - show “Connection unstable” badge
  - keep calculations working even if Liveblocks drops
- Add strict analytics rules:
  - never collect last4
  - no session tokens in URLs sent to analytics
- Add end-session behavior:
  - rep ends session → customer sees “Thanks” state
  - auto-expire view after X minutes

**Deliverable:** “feels like an app” and won’t break under real conditions.

---

## 9) Rep Experience Script Hooks (what the UI should support)
Provide on-screen “talk track” hints for rep:
- Step 1: “You’re approved up to $X. Let’s tailor the payment.”
- Step 2: Spotlight payment slider
- Step 3: Spotlight down payment
- Step 4: Spotlight balloon option (if relevant) + simple explanation modal
- Step 5: Spotlight confirm CTA

Rep panel should have one-click “Advance step” buttons that also trigger customer UI transitions.

---

## 10) Edge Cases to Handle
- Customer opens link but doesn’t verify → expires → show “Link expired, request a new one”
- Too many verification attempts → lock session → show “Call us to continue”
- Approval expired or revoked → show “Approval not available”
- Customer rotates phone / small screens → maintain sticky CTA and readable controls
- Rep joins late → customer sees presence update
- Two reps join → allow, but only one “controller” (optional) or both can control (log it)

---

## 11) Implementation Notes (important technical decisions)
### 11.1 Token hashing
- Store only `hash(sessionToken)` in DB
- On request, hash incoming token and compare

### 11.2 Verification hashing
- Store `hash(last4 + salt)` (salt per customer or per session)
- Compare hashed input, never store raw

### 11.3 Rate limiting
- Per-session attempt counter + server-side throttling
- Optionally IP-based rate limit

### 11.4 Avoid putting secrets in query strings
- Token is in path; still treat it as sensitive
- Prevent it from being logged in analytics and server logs

---

## 12) Definition of Done (what “flawless” means)
- Customer can open link, verify, and see approval in < 3 seconds on LTE
- Sliders are smooth (no jank) and values are stable
- Rep can reliably spotlight and advance steps
- All sensitive values are protected (no logging, no plaintext storage)
- Term confirmation is validated server-side and recorded with audit trail
- UI looks and behaves like a mobile app (sticky CTA, gestures, drawers, transitions)

---

## 13) Build Checklist (copy/paste into task tracker)
- [ ] Next.js + Tailwind setup
- [ ] Finance calc module + tests
- [ ] DB schema + migrations
- [ ] Session create endpoint (returns SMS-ready link)
- [ ] Verification page + verify endpoint
- [ ] Terms page UI + constraints validation
- [ ] Liveblocks auth endpoint + room permissions
- [ ] Customer presence + spotlight + step transitions
- [ ] Rep control panel
- [ ] Confirm terms endpoint + handoff to closing
- [ ] Audit logging
- [ ] Rate limiting + lockouts
- [ ] Performance polish (images, skeletons, no CLS)
- [ ] Security review (logging, analytics, token handling)

---

## 14) Suggested MVP Scope (to ship fast without losing the magic)
**Ship first:**
- Link + last4 verification
- Terms page with: term selector + down payment + payment output
- Liveblocks: presence + spotlight + step changes
- Confirm terms → store selection → “Proceed to closing”

**Add next:**
- Balloon + payoff options
- Control lock/unlock
- Rep “recommended preset” push
- Detailed amortization preview

---
