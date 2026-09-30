import { createServer } from "http";
import { createApp, ensureTablesExist, log } from "./app";
import { serveStatic } from "./static";

const httpServer = createServer();

(async () => {
  // CRITICAL: Ensure database tables exist before starting routes
  // If this fails, the server MUST NOT start accepting requests
  try {
    log("Initializing database...");
    await ensureTablesExist();
    log("Database initialized successfully - all tables ready");
  } catch (error) {
    console.error("FATAL: Database initialization failed:", error);
    log(`FATAL: Database initialization failed - server cannot start safely`);
    process.exit(1); // Exit with error - don't serve requests without database
  }

  const app = await createApp(httpServer);
  httpServer.on("request", app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
