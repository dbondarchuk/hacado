const COLLECTIONS = [
  "templates",
  "pages",
  "page-headers",
  "page-footers",
  "connected-apps",
];

const OPTION_TAG = /\{\{([#^/]?)\s*option\b([^}]*?)\s*\}\}/g;
const NESTED_OPTION = /waitlistEntry\.option\b/g;
const SERVICE_TAG = /\{\{([#^/]?)\s*service\b([^}]*?)\s*\}\}/g;
const NESTED_SERVICE = /waitlistEntry\.service\b/g;

const PHRASES = [
  ["Option selected", "Service selected"],
  ["Option sélectionnée", "Service sélectionné"],
  ["Opción seleccionada", "Servicio seleccionado"],
  ["Обрана опція", "Обрана послуга"],
];

/**
 * @param {string} value
 * @param {RegExp} pattern
 * @param {string} replacement
 * @returns {{ value: string, changed: boolean }}
 */
function replacePattern(value, pattern, replacement) {
  if (!pattern.test(value)) {
    pattern.lastIndex = 0;
    return { value, changed: false };
  }

  pattern.lastIndex = 0;
  return { value: value.replace(pattern, replacement), changed: true };
}

/**
 * Rewrite Mustache service placeholders from `option` to `service`.
 * @param {unknown} value
 * @param {RegExp} tagPattern
 * @param {string} tagReplacement
 * @param {RegExp} nestedPattern
 * @param {string} nestedReplacement
 * @param {Array<[string, string]>} phrases
 * @returns {{ value: unknown, changed: boolean }}
 */
function rewriteValue(
  value,
  tagPattern,
  tagReplacement,
  nestedPattern,
  nestedReplacement,
  phrases,
) {
  if (typeof value === "string") {
    const tags = replacePattern(value, tagPattern, tagReplacement);
    const nested = replacePattern(tags.value, nestedPattern, nestedReplacement);
    let next = nested.value;
    let changed = tags.changed || nested.changed;
    for (const [from, to] of phrases) {
      if (!next.includes(from)) continue;
      next = next.replaceAll(from, to);
      changed = true;
    }

    return { value: next, changed };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const result = rewriteValue(
        item,
        tagPattern,
        tagReplacement,
        nestedPattern,
        nestedReplacement,
        phrases,
      );
      if (result.changed) changed = true;
      return result.value;
    });

    return { value: next, changed };
  }

  if (value && typeof value === "object") {
    let changed = false;
    const next = {};
    for (const [key, child] of Object.entries(value)) {
      const result = rewriteValue(
        child,
        tagPattern,
        tagReplacement,
        nestedPattern,
        nestedReplacement,
        phrases,
      );
      next[key] = result.value;
      if (result.changed) changed = true;
    }

    return { value: next, changed };
  }

  return { value, changed: false };
}

/**
 * @param {import('mongodb').Db} db
 * @param {RegExp} tagPattern
 * @param {string} tagReplacement
 * @param {RegExp} nestedPattern
 * @param {string} nestedReplacement
 * @param {Array<[string, string]>} phrases
 */
async function rewriteCollections(
  db,
  tagPattern,
  tagReplacement,
  nestedPattern,
  nestedReplacement,
  phrases,
) {
  let updated = 0;

  for (const name of COLLECTIONS) {
    const collection = db.collection(name);
    const cursor = collection.find({});

    for await (const doc of cursor) {
      const { _id, ...rest } = doc;
      const result = rewriteValue(
        rest,
        tagPattern,
        tagReplacement,
        nestedPattern,
        nestedReplacement,
        phrases,
      );

      if (!result.changed) continue;

      await collection.replaceOne({ _id }, { _id, ...result.value });
      updated++;
    }
  }

  return updated;
}

module.exports = {
  /**
   * Stored templates used `{{option.name}}` for the booked service.
   * Rewrite those placeholders to `{{service.name}}`. Rendering still accepts
   * `option` as an alias.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const updated = await rewriteCollections(
      db,
      OPTION_TAG,
      "{{$1service$2}}",
      NESTED_OPTION,
      "waitlistEntry.service",
      PHRASES,
    );

    console.log(
      `Rewrote option placeholders to service in ${updated} document(s) across ${COLLECTIONS.join(", ")}`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db) {
    const updated = await rewriteCollections(
      db,
      SERVICE_TAG,
      "{{$1option$2}}",
      NESTED_SERVICE,
      "waitlistEntry.option",
      PHRASES.map(([from, to]) => [to, from]),
    );

    console.log(
      `Restored service placeholders to option in ${updated} document(s)`,
    );
  },
};
