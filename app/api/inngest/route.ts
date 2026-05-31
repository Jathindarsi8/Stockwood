import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  sendWelcomeEmail,
  dailyNewsDigestCron,
  sendNewsDigest,
  stockResearchOrchestrator,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendWelcomeEmail,
    dailyNewsDigestCron,
    sendNewsDigest,
    stockResearchOrchestrator,
  ],
});