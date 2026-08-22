/**
 * Backfill `configuration.booking.value.catalog` from the legacy flat
 * `value.options` list so public booking and admin settings no longer
 * need a runtime fallback.
 *
 * @param db {import('mongodb').Db}
 */
module.exports = {
  async up(db) {
    const collection = db.collection("configuration");
    const cursor = collection.find({ key: "booking" });
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const value = doc?.value;
      if (!value || typeof value !== "object") continue;

      const catalog = value.catalog;
      if (Array.isArray(catalog) && catalog.length > 0) continue;

      const options = Array.isArray(value.options) ? value.options : [];
      const nextCatalog = options
        .map((option) => option?.id)
        .filter((id) => typeof id === "string" && id.length > 0)
        .map((id) => ({
          type: "option",
          id,
          optionId: id,
        }));

      await collection.updateOne(
        { _id: doc._id },
        { $set: { "value.catalog": nextCatalog } },
      );
      updated += 1;
    }

    console.log(`Backfilled booking catalog on ${updated} configuration document(s)`);
  },

  /**
   * Restore the flat `options` list from catalog service leaves (skip groups
   * and packages), then drop `catalog`.
   *
   * @param db {import('mongodb').Db}
   */
  async down(db) {
    const collection = db.collection("configuration");
    const cursor = collection.find({ key: "booking" });
    let updated = 0;

    const optionIdsFromCatalog = (nodes) => {
      const ids = [];
      const walk = (list) => {
        if (!Array.isArray(list)) return;
        for (const node of list) {
          if (!node || typeof node !== "object") continue;
          if (node.type === "option" && typeof node.optionId === "string") {
            ids.push(node.optionId);
          }
          if (node.type === "group") walk(node.children);
        }
      };
      walk(nodes);
      return ids;
    };

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const value = doc?.value;
      if (!value || typeof value !== "object") continue;

      const catalog = value.catalog;
      if (!Array.isArray(catalog)) continue;

      const ids = optionIdsFromCatalog(catalog);
      await collection.updateOne(
        { _id: doc._id },
        {
          $set: { "value.options": ids.map((id) => ({ id })) },
          $unset: { "value.catalog": "" },
        },
      );
      updated += 1;
    }

    console.log(
      `Restored booking options from catalog services on ${updated} configuration document(s)`,
    );
  },
};
