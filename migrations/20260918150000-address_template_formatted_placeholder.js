const PLACEHOLDER_RE = /\{\{(general|config)\.address\}\}/g;
const REPLACEMENT = "{{$1.address.formatted}}";

const COLLECTIONS = [
  "pages",
  "page-headers",
  "page-footers",
  "templates",
];

/**
 * Recursively rewrite Mustache address placeholders in nested document values.
 * @param {unknown} value
 * @returns {{ value: unknown, changed: boolean }}
 */
function rewriteValue(value) {
  if (typeof value === "string") {
    if (!PLACEHOLDER_RE.test(value)) {
      return { value, changed: false };
    }
    PLACEHOLDER_RE.lastIndex = 0;
    return {
      value: value.replace(PLACEHOLDER_RE, REPLACEMENT),
      changed: true,
    };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const result = rewriteValue(item);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: next, changed };
  }

  if (value && typeof value === "object") {
    let changed = false;
    const next = {};
    for (const [key, child] of Object.entries(value)) {
      const result = rewriteValue(child);
      next[key] = result.value;
      if (result.changed) changed = true;
    }
    return { value: next, changed };
  }

  return { value, changed: false };
}

module.exports = {
  /**
   * Update stored page/email Mustache placeholders from `{{….address}}` to
   * `{{….address.formatted}}` after PostalAddress became an object.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const session = client.startSession();
    let updated = 0;

    try {
      await session.withTransaction(async () => {
        for (const name of COLLECTIONS) {
          const collection = db.collection(name);
          const cursor = collection.find({}, { session });

          for await (const doc of cursor) {
            const { _id, ...rest } = doc;
            const result = rewriteValue(rest);
            if (!result.changed) continue;

            await collection.replaceOne(
              { _id },
              { _id, ...(result.value) },
              { session },
            );
            updated++;
          }
        }
      });
    } finally {
      await session.endSession();
    }

    console.log(
      `Rewrote address placeholders in ${updated} document(s) across ${COLLECTIONS.join(", ")}`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const session = client.startSession();
    const downRe = /\{\{(general|config)\.address\.formatted\}\}/g;
    const downReplacement = "{{$1.address}}";

    /**
     * @param {unknown} value
     * @returns {{ value: unknown, changed: boolean }}
     */
    function rewriteDown(value) {
      if (typeof value === "string") {
        if (!downRe.test(value)) {
          return { value, changed: false };
        }
        downRe.lastIndex = 0;
        return {
          value: value.replace(downRe, downReplacement),
          changed: true,
        };
      }

      if (Array.isArray(value)) {
        let changed = false;
        const next = value.map((item) => {
          const result = rewriteDown(item);
          if (result.changed) changed = true;
          return result.value;
        });
        return { value: next, changed };
      }

      if (value && typeof value === "object") {
        let changed = false;
        const next = {};
        for (const [key, child] of Object.entries(value)) {
          const result = rewriteDown(child);
          next[key] = result.value;
          if (result.changed) changed = true;
        }
        return { value: next, changed };
      }

      return { value, changed: false };
    }

    try {
      await session.withTransaction(async () => {
        for (const name of COLLECTIONS) {
          const collection = db.collection(name);
          const cursor = collection.find({}, { session });

          for await (const doc of cursor) {
            const { _id, ...rest } = doc;
            const result = rewriteDown(rest);
            if (!result.changed) continue;

            await collection.replaceOne(
              { _id },
              { _id, ...(result.value) },
              { session },
            );
          }
        }
      });
    } finally {
      await session.endSession();
    }
  },
};
