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
- [ ] Convex schema (Approval, Vehicle, Session, TermSelection, AuditEvent)
- [ ] Seed data script
- [ ] Basic queries/mutations

## Phase 3: Customer Verification Flow
- [ ] `/a/[token]` verification page (last 4 entry)
- [ ] Session token validation
- [ ] Rate limiting / lockout logic

## Phase 4: Customer Terms Page
- [ ] Vehicle card + payment panel
- [ ] Term slider (24-84), down payment input, balloon toggle
- [ ] Real-time calculation display
- [ ] Confirm terms flow → placeholder closing page

## Phase 5: Rep Dashboard
- [ ] CRUD for Vehicles
- [ ] CRUD for Approvals
- [ ] CRUD for Sessions (generate magic links)

## Phase 6: Liveblocks Integration
- [ ] Room setup + auth endpoint
- [ ] Rep cursor tracking (Figma-style)
- [ ] Spotlight highlighting
- [ ] Control locking
- [ ] Side-by-side rep view

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
