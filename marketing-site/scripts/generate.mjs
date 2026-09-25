/**
 * Wrapper so `node generate.mjs` works without remembering tsx flags.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const result = spawnSync(
  "npx",
  ["--yes", "tsx", path.join(dir, "generate.ts")],
  { stdio: "inherit", shell: true, cwd: dir },
);
process.exit(result.status ?? 1);
