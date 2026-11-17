import type {
  BuilderDocumentSettings,
  BuilderKind,
  DocumentSettingsProposal,
  ValidationIssue,
  ValidationResult,
} from "../types";

const PAGE_KEYS = new Set([
  "title",
  "slug",
  "description",
  "keywords",
  "headerId",
  "footerId",
]);

const EMAIL_KEYS = new Set(["name", "subject"]);
const FOOTER_KEYS = new Set(["name"]);

function allowedKeysForBuilder(builder: BuilderKind): Set<string> {
  if (builder === "page") return PAGE_KEYS;
  if (builder === "email") return EMAIL_KEYS;

  return FOOTER_KEYS;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeDocumentSettingsPatch(
  builder: BuilderKind,
  raw: unknown,
): {
  settings: Partial<BuilderDocumentSettings>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const settings: Partial<BuilderDocumentSettings> = {};

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    issues.push({
      path: "settings",
      message: "settings must be an object",
    });

    return { settings, issues };
  }

  const allowed = allowedKeysForBuilder(builder);
  const record = raw as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null) continue;

    if (!allowed.has(key)) {
      issues.push({
        path: `settings.${key}`,
        message: `Setting "${key}" is not editable for the ${builder} builder`,
      });

      continue;
    }

    if (typeof value !== "string") {
      issues.push({
        path: `settings.${key}`,
        message: `Setting "${key}" must be a string`,
      });

      continue;
    }

    const trimmed = asOptionalString(value);

    if (!trimmed) {
      issues.push({
        path: `settings.${key}`,
        message: `Setting "${key}" must not be empty`,
      });

      continue;
    }

    (settings as Record<string, string>)[key] = trimmed;
  }

  if (!Object.keys(settings).length && !issues.length) {
    issues.push({
      path: "settings",
      message: "settings must include at least one field",
    });
  }

  return { settings, issues };
}

export function buildDocumentSettingsProposal(input: {
  builder: BuilderKind;
  summary: string;
  settings: unknown;
}): {
  validation: ValidationResult;
  proposal: DocumentSettingsProposal;
} {
  const normalized = normalizeDocumentSettingsPatch(
    input.builder,
    input.settings,
  );

  const validation: ValidationResult = {
    valid: normalized.issues.length === 0,
    issues: normalized.issues,
  };

  return {
    validation,
    proposal: {
      summary: input.summary || "Update document settings",
      settings: normalized.settings,
      warnings: validation.valid
        ? undefined
        : validation.issues.map((issue) =>
            issue.path ? `${issue.path}: ${issue.message}` : issue.message,
          ),
    },
  };
}
