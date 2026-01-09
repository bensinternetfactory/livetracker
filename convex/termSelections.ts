import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ QUERIES ============

export const getBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("termSelections")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  },
});

export const getByApproval = query({
  args: { approvalId: v.id("approvals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("termSelections")
      .withIndex("by_approval", (q) => q.eq("approvalId", args.approvalId))
      .collect();
  },
});

// ============ MUTATIONS ============

export const confirm = mutation({
  args: {
    sessionId: v.id("sessions"),
    termMonths: v.number(),
    downPayment: v.number(),
    balloonAmount: v.number(),
    monthlyPayment: v.number(),
    totalPayments: v.number(),
    totalInterest: v.number(),
    amountFinanced: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "verified" && session.status !== "active") {
      throw new Error("Session is not in a valid state for term confirmation");
    }

    const approval = await ctx.db.get(session.approvalId);
    if (!approval) {
      throw new Error("Approval not found");
    }

    // Validate against approval constraints
    if (args.termMonths < approval.minTermMonths || args.termMonths > approval.maxTermMonths) {
      throw new Error(`Term must be between ${approval.minTermMonths} and ${approval.maxTermMonths} months`);
    }

    if (args.balloonAmount > 0 && !approval.balloonAllowed) {
      throw new Error("Balloon payments are not allowed for this approval");
    }

    if (args.balloonAmount > 0 && approval.maxBalloonPercent) {
      const balloonPercent = (args.balloonAmount / args.amountFinanced) * 100;
      if (balloonPercent > approval.maxBalloonPercent) {
        throw new Error(`Balloon cannot exceed ${approval.maxBalloonPercent}% of amount financed`);
      }
    }

    // Check if there's already a selection for this session
    const existing = await ctx.db
      .query("termSelections")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        termMonths: args.termMonths,
        downPayment: args.downPayment,
        balloonAmount: args.balloonAmount,
        monthlyPayment: args.monthlyPayment,
        totalPayments: args.totalPayments,
        totalInterest: args.totalInterest,
        amountFinanced: args.amountFinanced,
        confirmedAt: Date.now(),
      });

      // Log audit event
      await ctx.db.insert("auditEvents", {
        sessionId: args.sessionId,
        approvalId: session.approvalId,
        actor: "customer",
        eventType: "terms_confirmed",
        payload: {
          termMonths: args.termMonths,
          downPayment: args.downPayment,
          balloonAmount: args.balloonAmount,
          monthlyPayment: args.monthlyPayment,
        },
        createdAt: Date.now(),
      });

      return existing._id;
    }

    // Create new selection
    const selectionId = await ctx.db.insert("termSelections", {
      sessionId: args.sessionId,
      approvalId: session.approvalId,
      termMonths: args.termMonths,
      downPayment: args.downPayment,
      balloonAmount: args.balloonAmount,
      monthlyPayment: args.monthlyPayment,
      totalPayments: args.totalPayments,
      totalInterest: args.totalInterest,
      amountFinanced: args.amountFinanced,
      confirmedAt: Date.now(),
    });

    // Log audit event
    await ctx.db.insert("auditEvents", {
      sessionId: args.sessionId,
      approvalId: session.approvalId,
      actor: "customer",
      eventType: "terms_confirmed",
      payload: {
        termMonths: args.termMonths,
        downPayment: args.downPayment,
        balloonAmount: args.balloonAmount,
        monthlyPayment: args.monthlyPayment,
      },
      createdAt: Date.now(),
    });

    return selectionId;
  },
});
