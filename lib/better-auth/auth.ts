import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { inngest } from "@/lib/inngest/client";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },

  user: {
    additionalFields: {
      country: { type: "string", required: true, input: true },
      investmentGoals: { type: "string", required: true, input: true },
      riskTolerance: { type: "string", required: true, input: true },
      preferredIndustry: { type: "string", required: true, input: true },
      newsOptIn: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: true,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const u = user as unknown as {
            email: string;
            name: string;
            country: string;
            investmentGoals: string;
            riskTolerance: string;
            preferredIndustry: string;
          };

          try {
            await inngest.send({
              name: "app/user.created",
              data: {
                email: u.email,
                name: u.name,
                country: u.country,
                investmentGoals: u.investmentGoals,
                riskTolerance: u.riskTolerance,
                preferredIndustry: u.preferredIndustry,
              },
            });
            console.log(`📨 app/user.created event fired for ${u.email}`);
          } catch (err) {
            console.error("Failed to fire app/user.created event:", err);
          }
        },
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});

export type Session = typeof auth.$Infer.Session;