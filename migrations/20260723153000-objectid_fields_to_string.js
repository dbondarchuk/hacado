const { ObjectId } = require("mongodb");

/**
 * Rewrite a document whose `_id` is ObjectId to the same hex as a string.
 * Also `$set` any listed FK fields that are still ObjectId.
 *
 * @param {import('mongodb').Collection} collection
 * @param {import('mongodb').Document} doc
 * @param {string[]} fkFields
 * @returns {Promise<boolean>} true if anything changed
 */
async function convertDoc(collection, doc, fkFields) {
  const oldId = doc._id;
  const idIsObjectId = oldId instanceof ObjectId;
  const $set = {};

  for (const field of fkFields) {
    if (doc[field] instanceof ObjectId) {
      $set[field] = doc[field].toString();
    }
  }

  if (!idIsObjectId && !Object.keys($set).length) {
    return false;
  }

  if (!idIsObjectId) {
    await collection.updateOne({ _id: oldId }, { $set });
    return true;
  }

  const newId = oldId.toString();
  const { _id, ...rest } = doc;
  const next = { ...rest, ...$set };

  const existing = await collection.findOne({ _id: newId });
  await collection.deleteOne({ _id: oldId });

  if (existing) {
    const mergeSet = {};
    for (const [k, v] of Object.entries(next)) {
      if (existing[k] === undefined || existing[k] === null) {
        mergeSet[k] = v;
      } else if (
        existing[k] instanceof ObjectId &&
        fkFields.includes(k)
      ) {
        mergeSet[k] = existing[k].toString();
      }
    }
    for (const field of fkFields) {
      if (next[field] != null && typeof next[field] === "string") {
        mergeSet[field] = next[field];
      }
    }
    if (Object.keys(mergeSet).length) {
      await collection.updateOne({ _id: newId }, { $set: mergeSet });
    }
  } else {
    await collection.insertOne({ _id: newId, ...next });
  }

  return true;
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} name
 * @param {string[]} fkFields
 */
async function convertCollection(db, name, fkFields) {
  const exists = (await db.listCollections({ name }).toArray()).length > 0;
  if (!exists) {
    console.log(`${name}: skipped (missing)`);
    return;
  }

  const collection = db.collection(name);
  const cursor = collection.find({});
  let converted = 0;
  let skipped = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    const changed = await convertDoc(collection, doc, fkFields);
    if (changed) converted++;
    else skipped++;
  }

  console.log(`${name}: converted=${converted}, skipped=${skipped}`);
}

module.exports = {
  /**
   * Convert ObjectId → string (same hex) for Better Auth collections:
   * - users: `_id`
   * - members: `_id`, `userId`
   * - accounts: `_id`, `accountId`, `userId`
   * - sessions: `_id`, `userId`
   *
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    await convertCollection(db, "users", []);
    await convertCollection(db, "members", ["userId"]);
    await convertCollection(db, "accounts", ["accountId", "userId"]);
    await convertCollection(db, "sessions", ["userId"]);
  },

  async down() {
    // Irreversible.
  },
};
