import { ActivityFeedPreview, ActivitySeverity } from "@timelish/types";
import { DateTime } from "luxon";
import { create } from "zustand";

export type NotificationsContextProps = {
  badges: Record<string, number>;
  setBadges: (
    setter: (prev: Record<string, number>) => Record<string, number>,
  ) => void;
};

export const useNotificationsStore = create<NotificationsContextProps>(
  (set) => ({
    badges: {} as Record<string, number>,
    setBadges: (setter) => {
      return set((state) => ({
        badges: setter(state.badges),
      }));
    },
  }),
);

type ActivityFeedStore = {
  previews: ActivityFeedPreview[];
  addPreviews: (
    previews: ActivityFeedPreview[],
    memberId: string,
    forceHighestSeverity?: ActivitySeverity | null,
  ) => void;
  highestSeverity: ActivitySeverity | null;
  clearSeverity: () => void;
};

export const useActivityFeedStore = create<ActivityFeedStore>((set, get) => ({
  previews: [],
  highestSeverity: null,
  addPreviews: (
    previews: ActivityFeedPreview[],
    memberId: string,
    forceHighestSeverity?: ActivitySeverity | null,
  ) => {
    const { previews: prevPreviews, highestSeverity: currentHighestSeverity } =
      get();

    const newPreviews = [...prevPreviews, ...previews]
      .reduce((acc, preview) => {
        const existingPreview = acc.find((p) => p.id === preview.id);
        if (existingPreview) {
          return acc;
        }
        return [...acc, preview];
      }, [] as ActivityFeedPreview[])
      .sort(
        (a, b) =>
          DateTime.fromISO(b.createdAt).toMillis() -
          DateTime.fromISO(a.createdAt).toMillis(),
      );

    const newHighestSeverity =
      typeof forceHighestSeverity !== "undefined"
        ? forceHighestSeverity
        : newPreviews.length > 0
          ? maxSeverityInPreview(
              newPreviews,
              currentHighestSeverity,
              memberId,
            )
          : currentHighestSeverity;

    set({
      previews: newPreviews.slice(0, 3),
      highestSeverity: newHighestSeverity,
    });
  },
  clearSeverity: () => set({ highestSeverity: null }),
}));

const SEVERITY_RANK: Record<ActivitySeverity, number> = {
  info: 0,
  success: 1,
  warning: 2,
  error: 3,
};

/** Highest severity among preview rows (newest activity slice); defaults to info when empty. */
function maxSeverityInPreview(
  preview: ActivityFeedPreview[],
  currentHighestSeverity: ActivitySeverity | null,
  memberId: string,
): ActivitySeverity | null {
  if (preview.length === 0) return currentHighestSeverity;

  let max = preview[0].severity ?? "info";
  for (let i = 1; i < preview.length; i++) {
    const previewItem = preview[i];
    if (
      previewItem.actor.kind === "member" &&
      previewItem.actor.memberId === memberId
    )
      continue;

    const s = preview[i].severity ?? "info";
    if (SEVERITY_RANK[s] > SEVERITY_RANK[max]) max = s;
  }

  if (!currentHighestSeverity) return max;

  const currentSeverityRank = SEVERITY_RANK[currentHighestSeverity];
  return SEVERITY_RANK[max] > currentSeverityRank
    ? max
    : currentHighestSeverity;
}
