# Build Plan: Mobile-First Finance Terms Presentation Page

## Requirements Summary

| Area | Decision |
|------|----------|
| **Stack** | TanStack Start + Convex + Liveblocks + Tailwind |
| **Auth** | None for MVP - mock rep dashboard |
| **Database** | Convex |
| **Slider Model** | Model A (term + down → payment calculates) |
| **Term Selector** | Slider from 24-84 months |
| **Down Payment** | Any amount ($0 typical, no hard cap) |
| **Balloon** | Include in MVP |
| **Payment Frequency** | Monthly only |
| **Verification** | SSN last 4 (hashed, never stored plain) |
| **Design** | Clean/minimal, Apple-like |
| **Vehicle Images** | Placeholder/stock for now |
| **Rep Dashboard** | Full CRUD (approvals, vehicles, sessions) |
| **Rep View** | Side-by-side (customer view + controls) |
| **Locking** | Actually locks customer controls |
| **Cursor Tracking** | Yes - Figma-style rep cursor visible to customer |
| **Step Flow** | Free-form (rep controls cursor, no rigid steps) |
| **Closing Flow** | Mock placeholder page |
| **Hosting** | Vercel |
| **Seed Data** | Create mock data |

---

## Phase 1: Foundation
- [x] TanStack Start + Convex + Tailwind setup
- [x] Finance calculation module + tests
- [x] Basic UI components (sliders, inputs, cards)

## Phase 2: Data Layer
- [x] Convex schema (Approval, Vehicle, Session, TermSelection, AuditEvent)
- [x] Seed data script
- [x] Basic queries/mutations

## Phase 3: Customer Verification Flow
- [x] `/a/[token]` verification page (last 4 entry)
- [x] Session token validation
- [x] Rate limiting / lockout logic

## Phase 4: Customer Terms Page
- [x] Vehicle card + payment panel
- [x] Term slider (24-84), down payment input, balloon toggle
- [x] Real-time calculation display
- [x] Confirm terms flow → placeholder closing page

## Phase 5: Rep Dashboard
- [x] CRUD for Vehicles
- [x] CRUD for Approvals
- [x] CRUD for Sessions (generate magic links)

## Phase 6: Liveblocks Integration
- [x] Room setup + auth endpoint
- [x] Rep cursor tracking (Figma-style)
- [x] Spotlight highlighting
- [x] Control locking
- [x] Side-by-side rep view

## Phase 7: Polish
- [ ] Skeleton loaders, animations
- [ ] Error states, offline handling
- [ ] Audit logging
- [ ] Security review

---

## Checkpoint Notes

Each phase is a commit checkpoint. After completing a phase:
1. Run tests/build to verify
2. Commit with phase description
3. Check off completed items above
