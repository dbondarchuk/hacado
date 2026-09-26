"use client";

import { AutoSkeleton } from "@hacado/ui";

export function DashboardKpiSkeleton({ count }: { count: number }) {
  return (
    <AutoSkeleton loading>
      <div
        className={
          count > 2
            ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            : "grid grid-cols-1 gap-3 sm:grid-cols-2"
        }
      >
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-4"
          >
            <div className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 space-y-1">
              <p className="text-xs uppercase tracking-[0.12em]">Label text</p>
              <p className="font-display text-3xl tabular-nums">00</p>
              <p className="text-sm">Detail line here</p>
            </div>
          </div>
        ))}
      </div>
    </AutoSkeleton>
  );
}

export function UpcomingAppointmentsSkeleton() {
  return (
    <AutoSkeleton loading>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-medium">
            Upcoming appointments
          </h2>
          <span className="text-sm">Open calendar</span>
        </div>
        <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="flex items-start gap-3 px-4 py-3">
              <div className="size-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm tabular-nums">Mon 14:00–14:45</p>
                  <span className="text-xs px-2 py-0.5 rounded-full">
                    Status
                  </span>
                </div>
                <p className="font-medium">Service name placeholder</p>
                <p className="text-sm">Customer · Member · 45 min</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AutoSkeleton>
  );
}

export function WeekSnapshotSkeleton({
  showCustomerChart,
}: {
  showCustomerChart: boolean;
}) {
  return (
    <AutoSkeleton loading>
      <section className="space-y-4">
        <h2 className="font-display text-xl font-medium">This week</h2>
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.12em]">Appointments</p>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex-1 h-6 rounded-md" />
              ))}
            </div>
            <div className="h-44 w-full rounded-md" />
          </div>
          {showCustomerChart ? (
            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.12em]">
                New vs returning
              </p>
              <div className="h-44 w-full rounded-md" />
            </div>
          ) : null}
        </div>
      </section>
    </AutoSkeleton>
  );
}

export function NeedsAttentionSkeleton() {
  return (
    <AutoSkeleton loading>
      <section className="space-y-3">
        <h2 className="font-display text-xl font-medium">Needs attention</h2>
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3"
            >
              <div className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">Attention title placeholder</p>
                <p className="text-sm">Description text for this item</p>
              </div>
              <div className="size-8 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </AutoSkeleton>
  );
}

export function QuickLinksSkeleton() {
  return (
    <AutoSkeleton loading>
      <div className="relative min-w-0 flex-1">
        <div className="flex gap-2 overflow-hidden whitespace-nowrap">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className="inline-flex h-8 shrink-0 items-center rounded-full border px-4 text-sm"
            >
              Link label
            </span>
          ))}
        </div>
      </div>
    </AutoSkeleton>
  );
}
