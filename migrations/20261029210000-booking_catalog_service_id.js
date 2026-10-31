/**
 * Rename booking catalog service leaves from `optionId` to `serviceId`.
 * Nodes live on `configuration` documents with `key: "booking"`, including
 * nested group children.
 *
 * @param db {import('mongodb').Db}
 */

/**
 * @param {unknown} nodes
 * @param {"up" | "down"} direction
 */
function renameCatalogServiceIds(nodes, direction) {
  if (!Array.isArray(nodes)) return false;
  let changed = false;

  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;

    if (node.type === "option") {
      if (direction === "up") {
        if (node.serviceId == null && node.optionId != null) {
          node.serviceId = node.optionId;
          delete node.optionId;
          changed = true;
        }
      } else if (node.optionId == null && node.serviceId != null) {
        node.optionId = node.serviceId;
        delete node.serviceId;
        changed = true;
      }
    }

    if (
      node.type === "group" &&
      renameCatalogServiceIds(node.children, direction)
    ) {
      changed = true;
    }
  }

  return changed;
}

module.exports = {
  /**
   * @param {import('mongodb').Db} db
   */
  async up(db) {
    const collection = db.collection("configuration");
    const cursor = collection.find({ key: "booking" });
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const catalog = doc?.value?.catalog;
      if (!renameCatalogServiceIds(catalog, "up")) continue;

      await collection.updateOne(
        { _id: doc._id },
        { $set: { "value.catalog": catalog } },
      );
      updated += 1;
    }

    console.log(
      `booking catalog: renamed optionId to serviceId on ${updated} configuration document(s)`,
    );
  },

  /**
   * @param {import('mongodb').Db} db
   */
  async down(db) {
    const collection = db.collection("configuration");
    const cursor = collection.find({ key: "booking" });
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const catalog = doc?.value?.catalog;
      if (!renameCatalogServiceIds(catalog, "down")) continue;

      await collection.updateOne(
        { _id: doc._id },
        { $set: { "value.catalog": catalog } },
      );
      updated += 1;
    }

    console.log(
      `booking catalog: renamed serviceId to optionId on ${updated} configuration document(s)`,
    );
  },
};
