module.exports = {
  /**
   * Remap staff identity from auth userId → memberId across:
   * - activities.source (actor user → member)
   * - appointments-history.data (by user → member, userId → memberId)
   * - blog-posts.author (type user → member, id → memberId)
   * - connected-apps (ensure memberId, unset userId, target user → member)
   *
   * Depends on 20260723140000-team_members_and_user_slots (+ later member backfills).
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    const members = await db.collection("members").find({}).toArray();

    /** @type {Map<string, Map<string, string>>} orgId → (userId → memberId) */
    const memberByOrgUser = new Map();
    for (const m of members) {
      const orgId = String(m.organizationId);
      const userId = String(m.userId);
      const memberId = String(m._id);
      if (!memberByOrgUser.has(orgId)) memberByOrgUser.set(orgId, new Map());
      memberByOrgUser.get(orgId).set(userId, memberId);
    }

    /**
     * @param {string} orgId
     * @param {string | undefined | null} userId
     */
    const resolveMemberId = (orgId, userId) => {
      if (!userId) return null;
      return memberByOrgUser.get(String(orgId))?.get(String(userId)) ?? null;
    };

    let activitiesUpdated = 0;
    let activitiesOrphans = 0;
    const activities = await db
      .collection("activities")
      .find({ "source.actor": "user" })
      .toArray();

    for (const doc of activities) {
      const memberId = resolveMemberId(
        doc.organizationId,
        doc.source?.actorId,
      );
      if (!memberId) {
        activitiesOrphans++;
        continue;
      }
      await db.collection("activities").updateOne(
        { _id: doc._id },
        {
          $set: {
            "source.actor": "member",
            "source.actorId": memberId,
          },
        },
      );
      activitiesUpdated++;
    }

    let historyUpdated = 0;
    let historyOrphans = 0;
    const history = await db
      .collection("appointments-history")
      .find({
        type: { $in: ["created", "statusChanged", "rescheduled"] },
        "data.by": "user",
      })
      .toArray();

    for (const doc of history) {
      const memberId = resolveMemberId(doc.organizationId, doc.data?.userId);
      /** @type {Record<string, unknown>} */
      const set = { "data.by": "member" };
      if (memberId) {
        set["data.memberId"] = memberId;
      } else if (doc.data?.userId) {
        historyOrphans++;
      }
      await db.collection("appointments-history").updateOne(
        { _id: doc._id },
        {
          $set: set,
          $unset: { "data.userId": "" },
        },
      );
      historyUpdated++;
    }

    let blogUpdated = 0;
    let blogOrphans = 0;
    const blogPosts = await db
      .collection("blog-posts")
      .find({ "author.type": "user" })
      .toArray();

    for (const doc of blogPosts) {
      const memberId = resolveMemberId(doc.organizationId, doc.author?.id);
      if (!memberId) {
        blogOrphans++;
        continue;
      }
      await db.collection("blog-posts").updateOne(
        { _id: doc._id },
        {
          $set: {
            "author.type": "member",
            "author.memberId": memberId,
          },
          $unset: { "author.id": "" },
        },
      );
      blogUpdated++;
    }

    let appsUpdated = 0;
    let appsOrphans = 0;
    const apps = await db.collection("connected-apps").find({}).toArray();

    for (const app of apps) {
      /** @type {Record<string, unknown>} */
      const set = {};
      /** @type {Record<string, string>} */
      const unset = {};

      let memberId = app.memberId ? String(app.memberId) : null;
      if (!memberId && app.userId) {
        memberId = resolveMemberId(app.organizationId, app.userId);
        if (!memberId) appsOrphans++;
      }
      if (memberId) set.memberId = memberId;

      if (app.target === "user") {
        set.target = "member";
      } else if (!app.target) {
        // Leave company default; prior migration should have set target.
      }

      if (app.userId !== undefined) {
        unset.userId = "";
      }

      if (Object.keys(set).length || Object.keys(unset).length) {
        /** @type {Record<string, unknown>} */
        const update = {};
        if (Object.keys(set).length) update.$set = set;
        if (Object.keys(unset).length) update.$unset = unset;
        await db.collection("connected-apps").updateOne({ _id: app._id }, update);
        appsUpdated++;
      }
    }

    console.log(
      `user→member migration: activities updated=${activitiesUpdated} orphans=${activitiesOrphans}; ` +
        `history updated=${historyUpdated} orphans=${historyOrphans}; ` +
        `blog-posts updated=${blogUpdated} orphans=${blogOrphans}; ` +
        `connected-apps updated=${appsUpdated} orphans=${appsOrphans}`,
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down() {
    console.log(
      "Skipping down: userId→memberId remap is not safely reversible.",
    );
  },
};
