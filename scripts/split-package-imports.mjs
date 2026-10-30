/**
 * Rewrites `from "<pkg>"` imports to `from "<pkg>/<subpath>"` using that
 * package's `exports` map. One script for types, services, builder, ui, etc.
 *
 * Usage:
 *   node scripts/split-package-imports.mjs <package-name> [--dry-run]
 *
 * Examples:
 *   node scripts/split-package-imports.mjs @hacado/builder --dry-run
 *   node scripts/split-package-imports.mjs @hacado/types
 *   node scripts/split-package-imports.mjs @hacado/ui
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");
const packageName = process.argv.find((a) => a.startsWith("@"));

if (!packageName) {
  console.error(
    "Usage: node scripts/split-package-imports.mjs <@scope/name> [--dry-run]",
  );
  process.exit(1);
}

const shortName = packageName.replace(/^@[^/]+\//, "");
const packageRoot = path.join(root, "packages", shortName);
const pkgJson = JSON.parse(
  fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);

/** Prefer deeper / more specific subpaths first; skip "." */
const SUBPATHS = Object.keys(pkgJson.exports || {})
  .filter((k) => k !== "." && k.startsWith("./"))
  .map((k) => k.slice(2))
  .sort((a, b) => {
    const depth = b.split("/").length - a.split("/").length;
    if (depth !== 0) return depth;
    // Prefer lighter modules before heavy UI shells
    const rank = (s) => {
      // Prefer the dedicated cn entry over utils (which also re-exports cn).
      if (s === "cn") return -1;
      if (s === "types" || s === "utils" || s === "helpers" || s === "hooks")
        return 0;
      if (s === "context" || s === "editor" || s === "reader" || s === "inputs")
        return 1;
      if (s === "overlay" || s === "dnd" || s === "portal") return 2;
      if (s === "builder" || s === "configuration-panel" || s === "data-table")
        return 9;
      return 5;
    };
    const rd = rank(a) - rank(b);
    if (rd !== 0) return rd;
    return a.localeCompare(b);
  });

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  "graphify-out",
  ".turbo",
]);

function resolveSubpathFile(subpath) {
  const rel = pkgJson.exports[`./${subpath}`];
  if (typeof rel !== "string") return undefined;
  const file = path.join(packageRoot, rel);
  return fs.existsSync(file) ? file : undefined;
}

function collectExports(program, checker, filePath, subpath, symbolToSubpath) {
  const source = program.getSourceFile(filePath);
  if (!source) return;
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) return;

  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    const name = symbol.getName();
    if (name === "default" || name.startsWith("__")) continue;
    if (!symbolToSubpath.has(name)) {
      symbolToSubpath.set(name, subpath);
    }
  }
}

function walkFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name) || entry.name.endsWith(".d.ts")) {
      continue;
    }
    out.push(full);
  }
}

function formatNamedElements(elements, isTypeOnlyClause) {
  const names = elements.map((el) => {
    const name = el.name.text;
    const prop = el.propertyName?.text;
    const core = prop ? `${prop} as ${name}` : name;
    return !isTypeOnlyClause && el.isTypeOnly ? `type ${core}` : core;
  });

  if (names.length <= 3 && names.join(", ").length < 60) {
    return `{ ${names.join(", ")} }`;
  }

  return `{\n  ${names.join(",\n  ")},\n}`;
}

function rewriteFile(filePath, symbolToSubpath, unknown) {
  const text = fs.readFileSync(filePath, "utf8");
  if (!text.includes(`"${packageName}"`) && !text.includes(`'${packageName}'`)) {
    return { changed: false };
  }

  const source = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  /** @type {{ start: number; end: number; replacement: string }[]} */
  const edits = [];

  for (const stmt of source.statements) {
    const isImport = ts.isImportDeclaration(stmt);
    const isExport = ts.isExportDeclaration(stmt);
    if (!isImport && !isExport) continue;
    if (!stmt.moduleSpecifier || !ts.isStringLiteral(stmt.moduleSpecifier)) {
      continue;
    }
    if (stmt.moduleSpecifier.text !== packageName) continue;

    const quote = stmt.moduleSpecifier.getText(source)[0] === "'" ? "'" : '"';

    if (isExport && !stmt.exportClause) {
      unknown.push({ file: filePath, symbol: "*", reason: "star-export" });
      continue;
    }

    const named =
      isImport && stmt.importClause?.namedBindings
        ? ts.isNamedImports(stmt.importClause.namedBindings)
          ? [...stmt.importClause.namedBindings.elements]
          : null
        : isExport && stmt.exportClause && ts.isNamedExports(stmt.exportClause)
          ? [...stmt.exportClause.elements]
          : null;

    if (!named) {
      unknown.push({
        file: filePath,
        symbol: "?",
        reason: "non-named-import",
      });
      continue;
    }

    /** @type {Map<string, typeof named>} */
    const bySubpath = new Map();
    /** @type {typeof named} */
    const unresolved = [];

    for (const el of named) {
      const exportedName = (el.propertyName ?? el.name).text;
      const subpath = symbolToSubpath.get(exportedName);
      if (!subpath) {
        unresolved.push(el);
        unknown.push({
          file: filePath,
          symbol: exportedName,
          reason: "missing",
        });
        continue;
      }
      const list = bySubpath.get(subpath) ?? [];
      list.push(el);
      bySubpath.set(subpath, list);
    }

    if (bySubpath.size === 0) continue;

    const isTypeOnly =
      (isImport && !!stmt.importClause?.isTypeOnly) ||
      (isExport && !!stmt.isTypeOnly);

    const parts = [];
    for (const [subpath, elements] of [...bySubpath.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const typePrefix = isTypeOnly
        ? isImport
          ? "import type "
          : "export type "
        : isImport
          ? "import "
          : "export ";
      parts.push(
        `${typePrefix}${formatNamedElements(elements, isTypeOnly)} from ${quote}${packageName}/${subpath}${quote};`,
      );
    }

    if (unresolved.length) {
      const typePrefix = isTypeOnly
        ? isImport
          ? "import type "
          : "export type "
        : isImport
          ? "import "
          : "export ";
      parts.push(
        `${typePrefix}${formatNamedElements(unresolved, isTypeOnly)} from ${quote}${packageName}${quote};`,
      );
    }

    edits.push({
      start: stmt.getStart(source),
      end: stmt.getEnd(),
      replacement: parts.join("\n"),
    });
  }

  if (!edits.length) return { changed: false };

  edits.sort((a, b) => b.start - a.start);
  let next = text;
  for (const edit of edits) {
    next = next.slice(0, edit.start) + edit.replacement + next.slice(edit.end);
  }

  return { changed: true, text: next, editCount: edits.length };
}

function main() {
  const configPath = path.join(packageRoot, "tsconfig.json");
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    packageRoot,
  );

  const entryFiles = [];
  for (const subpath of SUBPATHS) {
    const file = resolveSubpathFile(subpath);
    if (!file) {
      console.warn(`missing entry for ${subpath}`);
      continue;
    }
    entryFiles.push({ subpath, file });
  }

  const program = ts.createProgram({
    rootNames: [
      ...new Set([...parsed.fileNames, ...entryFiles.map((e) => e.file)]),
    ],
    options: parsed.options,
  });
  const checker = program.getTypeChecker();

  /** @type {Map<string, string>} */
  const symbolToSubpath = new Map();
  for (const { subpath, file } of entryFiles) {
    collectExports(program, checker, file, subpath, symbolToSubpath);
  }

  console.log(
    `Mapped ${symbolToSubpath.size} exports across ${entryFiles.length} subpaths for ${packageName}`,
  );

  const files = [];
  for (const dir of ["apps", "packages", "scripts", "marketing-site"]) {
    const full = path.join(root, dir);
    if (fs.existsSync(full)) walkFiles(full, files);
  }

  /** @type {{ file: string; symbol: string; reason: string }[]} */
  const unknown = [];
  let changedFiles = 0;
  let totalEdits = 0;

  for (const file of files) {
    if (file.startsWith(packageRoot + path.sep)) continue;

    const result = rewriteFile(file, symbolToSubpath, unknown);
    if (!result.changed) continue;
    changedFiles++;
    totalEdits += result.editCount ?? 0;
    if (!dryRun) fs.writeFileSync(file, result.text, "utf8");
  }

  const missing = unknown.filter((u) => u.reason === "missing");
  const other = unknown.filter((u) => u.reason !== "missing");

  console.log(
    `${dryRun ? "[dry-run] " : ""}Updated ${changedFiles} files (${totalEdits} import sites)`,
  );
  if (missing.length) {
    const uniq = [...new Set(missing.map((m) => m.symbol))].sort();
    console.log(`Unresolved symbols (${uniq.length}): ${uniq.join(", ")}`);
    for (const m of missing.slice(0, 25)) {
      console.log(`  ${path.relative(root, m.file)}: ${m.symbol}`);
    }
  }
  if (other.length) {
    console.log(`Skipped special imports: ${other.length}`);
  }
}

main();
