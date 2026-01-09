import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { generateToken, hashToken, verifySaltedHash } from "./lib/hash";

// Session defaults
const MAX_VERIFICATION_ATTEMPTS = 5;

// ============ QUERIES ============

export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("locked"),
      v.literal("expired")
    )),
    repId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let sessions;

    if (args.repId) {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_rep", (q) => q.eq("createdByRepId", args.repId!))
        .order("desc")
        .collect();
    } else if (args.status) {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      sessions = await ctx.db.query("sessions").order("desc").collect();
    }

    // Fetch associated approvals and vehicles
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const approval = await ctx.db.get(session.approvalId);
        const vehicle = approval ? await ctx.db.get(approval.vehicleId) : null;
        return {
          ...session,
          tokenHash: undefined, // Never expose
          approval: approval ? {
            ...approval,
            customerLast4Hash: undefined,
            customerLast4Salt: undefined,
          } : null,
          vehicle,
        };
      })
    );

    return sessionsWithDetails;
  },
});

export const get = query({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) return null;

    const approval = await ctx.db.get(session.approvalId);
    const vehicle = approval ? await ctx.db.get(approval.vehicleId) : null;

    return {
      ...session,
      tokenHash: undefined,
      approval: approval ? {
        ...approval,
        customerLast4Hash: undefined,
        customerLast4Salt: undefined,
      } : null,
      vehicle,
    };
  },
});

/**
 * Get session by token hash - used for customer verification flow
 * This is a query so it can be called from the client
 */
export const getByToken = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();

    if (!session) return null;

    // Check expiry
    if (session.expiresAt < Date.now()) {
      return { ...session, status: "expired" as const, tokenHash: undefined };
    }

    const approval = await ctx.db.get(session.approvalId);
    const vehicle = approval ? await ctx.db.get(approval.vehicleId) : null;

    return {
      ...session,
      tokenHash: undefined,
      approval: approval ? {
        ...approval,
        customerLast4Hash: undefined,
        customerLast4Salt: undefined,
      } : null,
      vehicle,
    };
  },
});

// ============ MUTATIONS ============

/**
 * Create a new session and return the magic link token
 * This is the only place the raw token is returned - store the hash
 */
export const create = mutation({
  args: {
    approvalId: v.id("approvals"),
    repId: v.string(),
    expiresInMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.approvalId);
    if (!approval) {
      throw new Error("Approval not found");
    }

    if (approval.status !== "active") {
      throw new Error("Approval is not active");
    }

    // Generate token and hash it
    const token = generateToken(32);
    const tokenHash = await hashToken(token);

    const expiresAt = Date.now() + (args.expiresInMinutes || 60) * 60 * 1000;

    const sessionId = await ctx.db.insert("sessions", {
      tokenHash,
      approvalId: args.approvalId,
      maxAttempts: MAX_VERIFICATION_ATTEMPTS,
      attemptCount: 0,
      status: "pending",
      expiresAt,
      createdAt: Date.now(),
      createdByRepId: args.repId,
    });

    // Log audit event
    await ctx.db.insert("auditEvents", {
      sessionId,
      approvalId: args.approvalId,
      actor: "rep",
      actorId: args.repId,
      eventType: "session_created",
      createdAt: Date.now(),
    });

    // Return the raw token (only time it's exposed)
    // Client should construct the magic link from this
    return {
      sessionId,
      token, // This is the only return of raw token!
      expiresAt,
    };
  },
});

/**
 * Verify customer's last 4 digits
 */
export const verify = mutation({
  args: {
    tokenHash: v.string(),
    last4: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    // Check status
    if (session.status === "locked") {
      return { success: false, error: "Session is locked due to too many attempts" };
    }

    if (session.status === "expired" || session.expiresAt < Date.now()) {
      await ctx.db.patch(session._id, { status: "expired" });
      return { success: false, error: "Session has expired" };
    }

    if (session.status !== "pending") {
      return { success: false, error: "Session already verified" };
    }

    // Get approval to verify last 4
    const approval = await ctx.db.get(session.approvalId);
    if (!approval) {
      return { success: false, error: "Approval not found" };
    }

    // Increment attempt count
    const newAttemptCount = session.attemptCount + 1;

    // Log attempt
    await ctx.db.insert("auditEvents", {
      sessionId: session._id,
      approvalId: session.approvalId,
      actor: "customer",
      eventType: "verification_attempted",
      createdAt: Date.now(),
    });

    // Verify the last 4
    const isValid = await verifySaltedHash(
      args.last4,
      approval.customerLast4Salt,
      approval.customerLast4Hash
    );

    if (!isValid) {
      // Update attempt count
      const shouldLock = newAttemptCount >= session.maxAttempts;

      await ctx.db.patch(session._id, {
        attemptCount: newAttemptCount,
        status: shouldLock ? "locked" : "pending",
      });

      // Log failure
      await ctx.db.insert("auditEvents", {
        sessionId: session._id,
        approvalId: session.approvalId,
        actor: "customer",
        eventType: shouldLock ? "session_locked" : "verification_failed",
        payload: { attemptsRemaining: session.maxAttempts - newAttemptCount },
        createdAt: Date.now(),
      });

      if (shouldLock) {
        return { success: false, error: "Too many attempts. Session is locked." };
      }

      return {
        success: false,
        error: "Incorrect verification code",
        attemptsRemaining: session.maxAttempts - newAttemptCount,
      };
    }

    // Success!
    await ctx.db.patch(session._id, {
      attemptCount: newAttemptCount,
      status: "verified",
      verifiedAt: Date.now(),
    });

    // Log success
    await ctx.db.insert("auditEvents", {
      sessionId: session._id,
      approvalId: session.approvalId,
      actor: "customer",
      eventType: "verification_succeeded",
      createdAt: Date.now(),
    });

    return { success: true, sessionId: session._id };
  },
});

/**
 * Mark session as active (rep joined)
 */
export const repJoin = mutation({
  args: {
    sessionId: v.id("sessions"),
    repId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "verified" && session.status !== "active") {
      throw new Error("Session not ready for rep to join");
    }

    await ctx.db.patch(args.sessionId, { status: "active" });

    await ctx.db.insert("auditEvents", {
      sessionId: args.sessionId,
      approvalId: session.approvalId,
      actor: "rep",
      actorId: args.repId,
      eventType: "rep_joined",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Complete session (terms confirmed)
 */
export const complete = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Mark approval as used
    await ctx.db.patch(session.approvalId, { status: "used" });

    await ctx.db.insert("auditEvents", {
      sessionId: args.sessionId,
      approvalId: session.approvalId,
      actor: "system",
      eventType: "terms_confirmed",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Expire old sessions (called by cron or manually)
 */
export const expireOldSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pendingSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const verifiedSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "verified"))
      .collect();

    const toExpire = [...pendingSessions, ...verifiedSessions].filter(
      (s) => s.expiresAt < now
    );

    for (const session of toExpire) {
      await ctx.db.patch(session._id, { status: "expired" });
      await ctx.db.insert("auditEvents", {
        sessionId: session._id,
        approvalId: session.approvalId,
        actor: "system",
        eventType: "session_expired",
        createdAt: now,
      });
    }

    return { expired: toExpire.length };
  },
});
