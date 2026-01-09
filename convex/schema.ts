import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Vehicle (tow truck) inventory
  vehicles: defineTable({
    title: v.string(),
    year: v.number(),
    make: v.string(),
    model: v.string(),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    vin: v.optional(v.string()),
    status: v.union(v.literal("available"), v.literal("sold"), v.literal("pending")),
    createdAt: v.number(),
  }),

  // Customer approvals
  approvals: defineTable({
    customerId: v.string(),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    // SSN last 4 - stored as salted hash, NEVER plain text
    customerLast4Hash: v.string(),
    customerLast4Salt: v.string(),

    vehicleId: v.id("vehicles"),
    approvalAmount: v.number(),
    apr: v.number(), // Stored as decimal (e.g., 0.0799 for 7.99%)

    // Term constraints
    minTermMonths: v.number(),
    maxTermMonths: v.number(),

    // Balloon constraints
    balloonAllowed: v.boolean(),
    maxBalloonPercent: v.optional(v.number()), // e.g., 30 for 30%

    // Fees
    documentFee: v.optional(v.number()),
    otherFees: v.optional(v.number()),

    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("used"),
      v.literal("cancelled")
    ),
    expiresAt: v.number(),
    createdAt: v.number(),
    createdByRepId: v.optional(v.string()),
  }).index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_vehicle", ["vehicleId"]),

  // Session links (the magic link texted to customer)
  sessions: defineTable({
    // Token is hashed before storage - lookup uses hash comparison
    tokenHash: v.string(),

    approvalId: v.id("approvals"),

    // Rate limiting
    maxAttempts: v.number(),
    attemptCount: v.number(),

    // Status
    status: v.union(
      v.literal("pending"),   // Created, not yet verified
      v.literal("verified"),  // Customer verified with last 4
      v.literal("active"),    // Rep has joined
      v.literal("completed"), // Terms confirmed
      v.literal("locked"),    // Too many attempts
      v.literal("expired")    // Time expired
    ),

    verifiedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
    createdByRepId: v.string(),
  }).index("by_token_hash", ["tokenHash"])
    .index("by_approval", ["approvalId"])
    .index("by_status", ["status"])
    .index("by_rep", ["createdByRepId"]),

  // Customer's selected terms
  termSelections: defineTable({
    sessionId: v.id("sessions"),
    approvalId: v.id("approvals"),

    // Selected terms
    termMonths: v.number(),
    downPayment: v.number(),
    balloonAmount: v.number(),

    // Calculated values (stored for audit)
    monthlyPayment: v.number(),
    totalPayments: v.number(),
    totalInterest: v.number(),
    amountFinanced: v.number(),

    confirmedAt: v.number(),
  }).index("by_session", ["sessionId"])
    .index("by_approval", ["approvalId"]),

  // Audit trail
  auditEvents: defineTable({
    sessionId: v.optional(v.id("sessions")),
    approvalId: v.optional(v.id("approvals")),

    actor: v.union(
      v.literal("customer"),
      v.literal("rep"),
      v.literal("system")
    ),
    actorId: v.optional(v.string()),

    eventType: v.union(
      v.literal("session_created"),
      v.literal("session_opened"),
      v.literal("verification_attempted"),
      v.literal("verification_failed"),
      v.literal("verification_succeeded"),
      v.literal("session_locked"),
      v.literal("rep_joined"),
      v.literal("rep_left"),
      v.literal("terms_changed"),
      v.literal("terms_confirmed"),
      v.literal("session_expired"),
      v.literal("spotlight_changed"),
      v.literal("controls_locked"),
      v.literal("controls_unlocked")
    ),

    // Additional event data (no sensitive info!)
    payload: v.optional(v.any()),

    createdAt: v.number(),
  }).index("by_session", ["sessionId"])
    .index("by_approval", ["approvalId"])
    .index("by_type", ["eventType"])
    .index("by_time", ["createdAt"]),
});
