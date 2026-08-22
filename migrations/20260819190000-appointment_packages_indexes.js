const APPOINTMENT_PACKAGES_COLLECTION_NAME = "appointment-packages";
const CUSTOMER_PACKAGES_COLLECTION_NAME = "customer-packages";
const PACKAGE_CREDIT_TRANSACTIONS_COLLECTION_NAME =
  "package-credit-transactions";

const ensureCollection = async (db, name) => {
  const collections = await db.listCollections({ name }).toArray();
  return collections.length > 0
    ? db.collection(name)
    : await db.createCollection(name);
};

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   */
  async up(db) {
    const appointmentPackages = await ensureCollection(
      db,
      APPOINTMENT_PACKAGES_COLLECTION_NAME,
    );
    const customerPackages = await ensureCollection(
      db,
      CUSTOMER_PACKAGES_COLLECTION_NAME,
    );

    const appointmentPackageIndexes = {
      org_status: { organizationId: 1, status: 1 },
      organizationId_updatedAt_1: { organizationId: 1, updatedAt: -1 },
    };
    const customerPackageIndexes = {
      org_customer_status: { organizationId: 1, customerId: 1, status: 1 },
      organizationId_packageId_1: { organizationId: 1, packageId: 1 },
      organizationId_purchasedAt_1: { organizationId: 1, purchasedAt: -1 },
    };

    for (const [name, index] of Object.entries(appointmentPackageIndexes)) {
      if (await appointmentPackages.indexExists(name)) continue;
      await appointmentPackages.createIndex(index, { name });
      console.log(
        `Created index ${name} on ${APPOINTMENT_PACKAGES_COLLECTION_NAME}`,
      );
    }

    for (const [name, index] of Object.entries(customerPackageIndexes)) {
      if (await customerPackages.indexExists(name)) continue;
      await customerPackages.createIndex(index, { name });
      console.log(
        `Created index ${name} on ${CUSTOMER_PACKAGES_COLLECTION_NAME}`,
      );
    }

    if (!(await customerPackages.indexExists("org_payment_intent_unique"))) {
      await customerPackages.createIndex(
        { organizationId: 1, paymentIntentId: 1 },
        { unique: true, sparse: true, name: "org_payment_intent_unique" },
      );
      console.log(
        `Created unique sparse index org_payment_intent_unique on ${CUSTOMER_PACKAGES_COLLECTION_NAME}`,
      );
    }

    const ledger = await db
      .listCollections({ name: PACKAGE_CREDIT_TRANSACTIONS_COLLECTION_NAME })
      .toArray();
    if (ledger.length) {
      await db.dropCollection(PACKAGE_CREDIT_TRANSACTIONS_COLLECTION_NAME);
      console.log(`Dropped ${PACKAGE_CREDIT_TRANSACTIONS_COLLECTION_NAME}`);
    }
  },

  /**
   * @param db {import('mongodb').Db}
   */
  async down(db) {
    const appointmentPackages = db.collection(
      APPOINTMENT_PACKAGES_COLLECTION_NAME,
    );
    const customerPackages = db.collection(CUSTOMER_PACKAGES_COLLECTION_NAME);

    for (const name of ["org_status", "organizationId_updatedAt_1"]) {
      if (await appointmentPackages.indexExists(name)) {
        await appointmentPackages.dropIndex(name);
      }
    }
    for (const name of [
      "org_customer_status",
      "organizationId_packageId_1",
      "organizationId_purchasedAt_1",
      "org_payment_intent_unique",
    ]) {
      if (await customerPackages.indexExists(name)) {
        await customerPackages.dropIndex(name);
      }
    }
  },
};
