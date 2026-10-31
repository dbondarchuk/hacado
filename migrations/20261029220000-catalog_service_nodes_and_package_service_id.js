/**
 * Catalog service leaves use `type: "service"` (previously `"option"`).
 * Package items store the included service as `serviceId` (previously `optionId`)
 * on `appointment-packages` and `customer-packages`.
 *
 * @param db {import('mongodb').Db}
 */

const PACKAGE_COLLECTIONS = ["appointment-packages", "customer-packages"];

/**
 * @param {unknown} nodes
 * @param {"up" | "down"} direction
 */
function renameCatalogNodeType(nodes, direction) {
  if (!Array.isArray(nodes)) return false;
  let changed = false;

  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;

    if (direction === "up") {
      if (
        (node.type === "option" || node.type === "service") &&
        node.serviceId == null &&
        node.optionId != null
      ) {
        node.serviceId = node.optionId;
        delete node.optionId;
        changed = true;
      }
      if (node.type === "option") {
        node.type = "service";
        changed = true;
      }
    } else if (node.type === "service") {
      node.type = "option";
      changed = true;
    }

    if (
      node.type === "group" &&
      renameCatalogNodeType(node.children, direction)
    ) {
      changed = true;
    }
  }

  return changed;
}

/**
 * @param {unknown} items
 * @param {"up" | "down"} direction
 */
function renamePackageItemServiceIds(items, direction) {
  if (!Array.isArray(items)) return false;
  let changed = false;

  for (const item of items) {
    if (!item || typeof item !== "object") continue;

    if (direction === "up") {
      if (item.serviceId == null && item.optionId != null) {
        item.serviceId = item.optionId;
        delete item.optionId;
        changed = true;
      } else if (item.optionId != null) {
        delete item.optionId;
        changed = true;
      }
    } else if (item.optionId == null && item.serviceId != null) {
      item.optionId = item.serviceId;
      delete item.serviceId;
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
    const configuration = db.collection("configuration");
    const cursor = configuration.find({ key: "booking" });
    let catalogs = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const catalog = doc?.value?.catalog;
      if (!renameCatalogNodeType(catalog, "up")) continue;

      await configuration.updateOne(
        { _id: doc._id },
        { $set: { "value.catalog": catalog } },
      );
      catalogs += 1;
    }

    let packages = 0;
    for (const name of PACKAGE_COLLECTIONS) {
      const collection = db.collection(name);
      const packageCursor = collection.find({
        "items.optionId": { $exists: true },
      });

      while (await packageCursor.hasNext()) {
        const doc = await packageCursor.next();
        if (!renamePackageItemServiceIds(doc?.items, "up")) continue;

        await collection.updateOne(
          { _id: doc._id },
          { $set: { items: doc.items } },
        );
        packages += 1;
      }
    }

    console.log(
      `catalog node type service: ${catalogs} configuration document(s); package item serviceId: ${packages} package document(s)`,
    );
  },

  /**
   * @param {import('mongodb').Db} db
   */
  async down(db) {
    const configuration = db.collection("configuration");
    const cursor = configuration.find({ key: "booking" });
    let catalogs = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const catalog = doc?.value?.catalog;
      if (!renameCatalogNodeType(catalog, "down")) continue;

      await configuration.updateOne(
        { _id: doc._id },
        { $set: { "value.catalog": catalog } },
      );
      catalogs += 1;
    }

    let packages = 0;
    for (const name of PACKAGE_COLLECTIONS) {
      const collection = db.collection(name);
      const packageCursor = collection.find({
        "items.serviceId": { $exists: true },
      });

      while (await packageCursor.hasNext()) {
        const doc = await packageCursor.next();
        if (!renamePackageItemServiceIds(doc?.items, "down")) continue;

        await collection.updateOne(
          { _id: doc._id },
          { $set: { items: doc.items } },
        );
        packages += 1;
      }
    }

    console.log(
      `catalog node type option: ${catalogs} configuration document(s); package item optionId: ${packages} package document(s)`,
    );
  },
};
