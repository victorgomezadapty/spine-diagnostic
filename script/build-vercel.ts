import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, mkdir, cp, writeFile } from "fs/promises";
import { execSync } from "child_process";

// Emits the Vercel Build Output API layout: static client + one API function.
const out = ".vercel/output";

async function main() {
  if (process.env.DATABASE_URL) {
    console.log("syncing database schema...");
    execSync("npx drizzle-kit push --force", { stdio: "inherit" });
  } else {
    console.warn("DATABASE_URL not set: skipping schema sync");
  }

  await rm(out, { recursive: true, force: true });
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();
  await mkdir(`${out}/static`, { recursive: true });
  await cp("dist/public", `${out}/static`, { recursive: true });

  console.log("building function...");
  const fn = `${out}/functions/api/index.func`;
  await mkdir(fn, { recursive: true });
  await esbuild({
    entryPoints: ["server/vercel.ts"],
    platform: "node",
    target: "node20",
    bundle: true,
    format: "cjs",
    outfile: `${fn}/index.js`,
    define: { "process.env.NODE_ENV": '"production"' },
    external: ["pg-native"],
    logLevel: "info",
  });
  await writeFile(`${fn}/package.json`, JSON.stringify({ type: "commonjs" }));
  await writeFile(
    `${fn}/.vc-config.json`,
    JSON.stringify({ runtime: "nodejs20.x", handler: "index.js", launcherType: "Nodejs" }),
  );

  await writeFile(
    `${out}/config.json`,
    JSON.stringify({
      version: 3,
      routes: [
        { src: "/api/(.*)", dest: "/api" },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
