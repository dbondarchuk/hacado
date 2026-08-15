/**
 * Backfill `options.staff` with all active organization members when empty/missing,
 * so existing services remain bookable after empty-staff means "not bookable".
 */

module.exports = {
  async up(db) {
    const options = db.collection("options");
    const members = db.collection("members");

    const cursor = options.find({
      $or: [
        { staff: { $exists: false } },
        { staff: null },
        { staff: { $size: 0 } },
      ],
    });

    let updated = 0;
    while (await cursor.hasNext()) {
      const option = await cursor.next();
      if (!option?.organizationId) continue;

      const activeMembers = await members
        .find(
          {
            organizationId: option.organizationId,
            status: "active",
          },
          { projection: { _id: 1 } },
        )
        .toArray();

      if (!activeMembers.length) continue;

      const staff = activeMembers.map((member) => ({
        memberId: String(member._id),
      }));

      await options.updateOne({ _id: option._id }, { $set: { staff } });
      updated += 1;
    }

    console.log(
      `Backfilled staff on ${updated} option(s) with active organization members`,
    );
  },

  async down() {
    // Irreversible: cannot know which staff arrays were empty before backfill.
  },
};
