import { mutation } from "./_generated/server";
import { generateSalt, hashWithSalt } from "./lib/hash";

/**
 * Seed the database with sample data for development
 */
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingVehicles = await ctx.db.query("vehicles").first();
    if (existingVehicles) {
      return { message: "Database already seeded", skipped: true };
    }

    // Create sample vehicles (tow trucks)
    const vehicles = [
      {
        title: "2024 Peterbilt 337 Tow Truck",
        year: 2024,
        make: "Peterbilt",
        model: "337",
        price: 125000,
        status: "available" as const,
        createdAt: Date.now(),
      },
      {
        title: "2023 Kenworth T270 Rollback",
        year: 2023,
        make: "Kenworth",
        model: "T270",
        price: 98500,
        status: "available" as const,
        createdAt: Date.now(),
      },
      {
        title: "2024 Ford F-650 Flatbed",
        year: 2024,
        make: "Ford",
        model: "F-650",
        price: 85000,
        status: "available" as const,
        createdAt: Date.now(),
      },
      {
        title: "2023 Freightliner M2 106 Wrecker",
        year: 2023,
        make: "Freightliner",
        model: "M2 106",
        price: 145000,
        status: "available" as const,
        createdAt: Date.now(),
      },
      {
        title: "2022 International MV607 Tow Truck",
        year: 2022,
        make: "International",
        model: "MV607",
        price: 72000,
        status: "available" as const,
        createdAt: Date.now(),
      },
    ];

    const vehicleIds = [];
    for (const vehicle of vehicles) {
      const id = await ctx.db.insert("vehicles", vehicle);
      vehicleIds.push(id);
    }

    // Create sample approvals with different customer scenarios
    const customers = [
      {
        customerId: "cust_001",
        customerName: "John Smith",
        customerPhone: "555-123-4567",
        customerEmail: "john.smith@example.com",
        last4: "1234",
        apr: 0.0799,
        approvalAmount: 130000,
        vehicleIndex: 0,
      },
      {
        customerId: "cust_002",
        customerName: "Maria Garcia",
        customerPhone: "555-234-5678",
        customerEmail: "maria.g@example.com",
        last4: "5678",
        apr: 0.0699,
        approvalAmount: 100000,
        vehicleIndex: 1,
      },
      {
        customerId: "cust_003",
        customerName: "Robert Johnson",
        customerPhone: "555-345-6789",
        customerEmail: "rjohnson@example.com",
        last4: "9012",
        apr: 0.0899,
        approvalAmount: 90000,
        vehicleIndex: 2,
      },
    ];

    const approvalIds = [];
    for (const customer of customers) {
      const salt = generateSalt();
      const hash = await hashWithSalt(customer.last4, salt);

      const id = await ctx.db.insert("approvals", {
        customerId: customer.customerId,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
        customerEmail: customer.customerEmail,
        customerLast4Hash: hash,
        customerLast4Salt: salt,
        vehicleId: vehicleIds[customer.vehicleIndex],
        approvalAmount: customer.approvalAmount,
        apr: customer.apr,
        minTermMonths: 24,
        maxTermMonths: 84,
        balloonAllowed: true,
        maxBalloonPercent: 30,
        documentFee: 499,
        status: "active",
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        createdAt: Date.now(),
        createdByRepId: "rep_001",
      });
      approvalIds.push(id);
    }

    return {
      message: "Database seeded successfully",
      created: {
        vehicles: vehicleIds.length,
        approvals: approvalIds.length,
      },
      // Return last4s for testing (would NOT do this in production!)
      testCredentials: customers.map((c) => ({
        name: c.customerName,
        last4: c.last4,
      })),
    };
  },
});

/**
 * Clear all data (for development only)
 */
export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete in order to respect foreign keys
    const auditEvents = await ctx.db.query("auditEvents").collect();
    for (const event of auditEvents) {
      await ctx.db.delete(event._id);
    }

    const termSelections = await ctx.db.query("termSelections").collect();
    for (const selection of termSelections) {
      await ctx.db.delete(selection._id);
    }

    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    const approvals = await ctx.db.query("approvals").collect();
    for (const approval of approvals) {
      await ctx.db.delete(approval._id);
    }

    const vehicles = await ctx.db.query("vehicles").collect();
    for (const vehicle of vehicles) {
      await ctx.db.delete(vehicle._id);
    }

    return {
      message: "Database cleared",
      deleted: {
        auditEvents: auditEvents.length,
        termSelections: termSelections.length,
        sessions: sessions.length,
        approvals: approvals.length,
        vehicles: vehicles.length,
      },
    };
  },
});
