import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateSalt, hashWithSalt } from "./lib/hash";

// ============ QUERIES ============

export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("used"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    let approvals;
    if (args.status) {
      approvals = await ctx.db
        .query("approvals")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      approvals = await ctx.db.query("approvals").order("desc").collect();
    }

    // Fetch associated vehicles
    const approvalsWithVehicles = await Promise.all(
      approvals.map(async (approval) => {
        const vehicle = await ctx.db.get(approval.vehicleId);
        return {
          ...approval,
          vehicle,
          // Never expose hash/salt to client
          customerLast4Hash: undefined,
          customerLast4Salt: undefined,
        };
      })
    );

    return approvalsWithVehicles;
  },
});

export const get = query({
  args: { id: v.id("approvals") },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.id);
    if (!approval) return null;

    const vehicle = await ctx.db.get(approval.vehicleId);

    return {
      ...approval,
      vehicle,
      // Never expose hash/salt to client
      customerLast4Hash: undefined,
      customerLast4Salt: undefined,
    };
  },
});

export const getByCustomer = query({
  args: { customerId: v.string() },
  handler: async (ctx, args) => {
    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    return approvals.map((approval) => ({
      ...approval,
      customerLast4Hash: undefined,
      customerLast4Salt: undefined,
    }));
  },
});

// ============ MUTATIONS ============

export const create = mutation({
  args: {
    customerId: v.string(),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerLast4: v.string(), // Raw last 4 - will be hashed

    vehicleId: v.id("vehicles"),
    approvalAmount: v.number(),
    apr: v.number(),

    minTermMonths: v.optional(v.number()),
    maxTermMonths: v.optional(v.number()),

    balloonAllowed: v.optional(v.boolean()),
    maxBalloonPercent: v.optional(v.number()),

    documentFee: v.optional(v.number()),
    otherFees: v.optional(v.number()),

    expiresInDays: v.optional(v.number()),
    repId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate last 4
    if (!/^\d{4}$/.test(args.customerLast4)) {
      throw new Error("Last 4 must be exactly 4 digits");
    }

    // Verify vehicle exists
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Hash the last 4 with a unique salt
    const salt = generateSalt();
    const hash = await hashWithSalt(args.customerLast4, salt);

    const expiresAt = Date.now() + (args.expiresInDays || 30) * 24 * 60 * 60 * 1000;

    const approvalId = await ctx.db.insert("approvals", {
      customerId: args.customerId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,
      customerLast4Hash: hash,
      customerLast4Salt: salt,

      vehicleId: args.vehicleId,
      approvalAmount: args.approvalAmount,
      apr: args.apr,

      minTermMonths: args.minTermMonths ?? 24,
      maxTermMonths: args.maxTermMonths ?? 84,

      balloonAllowed: args.balloonAllowed ?? true,
      maxBalloonPercent: args.maxBalloonPercent ?? 30,

      documentFee: args.documentFee,
      otherFees: args.otherFees,

      status: "active",
      expiresAt,
      createdAt: Date.now(),
      createdByRepId: args.repId,
    });

    return approvalId;
  },
});

export const update = mutation({
  args: {
    id: v.id("approvals"),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    approvalAmount: v.optional(v.number()),
    apr: v.optional(v.number()),
    minTermMonths: v.optional(v.number()),
    maxTermMonths: v.optional(v.number()),
    balloonAllowed: v.optional(v.boolean()),
    maxBalloonPercent: v.optional(v.number()),
    documentFee: v.optional(v.number()),
    otherFees: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("used"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Approval not found");
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
    return id;
  },
});

export const cancel = mutation({
  args: { id: v.id("approvals") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Approval not found");
    }
    await ctx.db.patch(args.id, { status: "cancelled" });
    return args.id;
  },
});
