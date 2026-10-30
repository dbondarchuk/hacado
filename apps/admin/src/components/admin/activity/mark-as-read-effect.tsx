"use client";

import { useActivityFeedStore } from "@/notifications/store";
import { activitiesApi } from "@hacado/api-sdk/admin/activities";
import React, { useEffect } from "react";

export const MarkAsReadEffect: React.FC<{
  uniqueKey: string | number;
}> = ({ uniqueKey }) => {
  const { clearSeverity } = useActivityFeedStore();
  useEffect(() => {
    void activitiesApi.markActivityFeedRead().then(() => {
      clearSeverity();
    });
  }, [uniqueKey]);

  return null;
};
