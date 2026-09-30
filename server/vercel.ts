import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { createApp, ensureTablesExist } from "./app";

// Vercel serverless entry: build the app once per warm instance, retry on failure.
let ready: Promise<ReturnType<typeof createApp> extends Promise<infer A> ? A : never> | null = null;

function init() {
  return (async () => {
    await ensureTablesExist();
    return createApp(createServer());
  })();
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    ready ??= init();
    const app = await ready;
    app(req as any, res as any);
  } catch (error) {
    ready = null;
    console.error("Init failed:", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Service unavailable" }));
  }
}
