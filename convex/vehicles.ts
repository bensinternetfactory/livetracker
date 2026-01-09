import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ QUERIES ============

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("available"), v.literal("sold"), v.literal("pending"))),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("vehicles")
        .filter((q) => q.eq(q.field("status"), args.status))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("vehicles").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("vehicles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ============ MUTATIONS ============

export const create = mutation({
  args: {
    title: v.string(),
    year: v.number(),
    make: v.string(),
    model: v.string(),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    vin: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const vehicleId = await ctx.db.insert("vehicles", {
      ...args,
      status: "available",
      createdAt: Date.now(),
    });
    return vehicleId;
  },
});

export const update = mutation({
  args: {
    id: v.id("vehicles"),
    title: v.optional(v.string()),
    year: v.optional(v.number()),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    vin: v.optional(v.string()),
    status: v.optional(v.union(v.literal("available"), v.literal("sold"), v.literal("pending"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Vehicle not found");
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("vehicles") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Vehicle not found");
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});
