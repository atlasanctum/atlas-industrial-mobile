import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { askAtlasIntelligence, completeOperationalControl, createAtlasScenario, decideAtlasRecommendation, decideAtlasScenario, getAtlasOperatingLayer, getAtlasWorkspace, syncAtlasEvents, uploadAtlasEvidence } from "./atlas-service";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  atlas: router({
    workspace: protectedProcedure.query(({ ctx }) => getAtlasWorkspace(ctx.user.id)),
    operatingLayer: protectedProcedure.query(({ ctx }) => getAtlasOperatingLayer(ctx.user.id)),
    syncEvents: protectedProcedure
      .input(z.object({
        events: z.array(z.object({
          clientEventId: z.string().uuid(),
          eventType: z.enum(["asset_scanned", "work_started", "work_completed", "inspection_recorded", "issue_reported", "evidence_captured"]),
          entityType: z.enum(["asset", "work_item", "inspection", "issue"]),
          entityId: z.string().min(1).max(256),
          occurredAt: z.string().datetime(),
          facilityId: z.string().uuid().optional(),
          payload: z.record(z.string(), z.unknown()),
        })).min(1).max(50),
      }))
      .mutation(({ ctx, input }) => syncAtlasEvents(ctx.user.id, input.events)),
    completeControl: protectedProcedure
      .input(z.object({ controlId: z.string().uuid(), evidenceEventIds: z.array(z.string().uuid()).max(20).default([]) }))
      .mutation(({ ctx, input }) => completeOperationalControl(ctx.user.id, input.controlId, input.evidenceEventIds)),
    uploadEvidence: protectedProcedure
      .input(z.object({ id: z.string().uuid(), eventClientId: z.string().uuid(), facilityId: z.string().uuid().optional(), entityType: z.enum(["asset", "work_item", "inspection", "issue"]), entityId: z.string().min(1).max(256), contentType: z.string().min(3).max(120), filename: z.string().min(1).max(255), sizeBytes: z.number().int().positive().max(16 * 1024 * 1024), base64: z.string().min(4).max(24 * 1024 * 1024) }))
      .mutation(({ ctx, input }) => uploadAtlasEvidence(ctx.user.id, input)),
    askIntelligence: protectedProcedure
      .input(z.object({ question: z.string().trim().min(4).max(1000) }))
      .mutation(({ ctx, input }) => askAtlasIntelligence(ctx.user.id, input.question)),
    createScenario: protectedProcedure
      .input(z.object({ scopeType: z.enum(["facility", "line", "asset", "enterprise"]), scopeId: z.string().min(1).max(256).optional(), premise: z.string().trim().min(8).max(1200), assumptions: z.record(z.string(), z.unknown()).default({}) }))
      .mutation(({ ctx, input }) => createAtlasScenario(ctx.user.id, input)),
    decideScenario: protectedProcedure
      .input(z.object({ scenarioId: z.string().uuid(), decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(1000).optional() }))
      .mutation(({ ctx, input }) => decideAtlasScenario(ctx.user.id, input.scenarioId, input.decision, input.note)),
    decideRecommendation: protectedProcedure
      .input(z.object({
        recommendationId: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        note: z.string().trim().max(1000).optional(),
      }))
      .mutation(({ ctx, input }) => decideAtlasRecommendation(ctx.user.id, input.recommendationId, input.decision, input.note)),
  }),
});

export type AppRouter = typeof appRouter;
