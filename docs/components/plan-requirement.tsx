import Link from "next/link";
import type { ReactNode } from "react";

type Plan = "Solo" | "Studio";

type PlanRequirementProps = {
  plan: Plan;
  children?: ReactNode;
};

export function PlanRequirement({ plan, children }: PlanRequirementProps) {
  return (
    <aside className="plan-requirement" role="note">
      <p className="plan-requirement-label">
        Requires the <strong>{plan}</strong> plan or higher
      </p>
      <div className="plan-requirement-body">
        {children ?? (
          <p>
            Upgrade under{" "}
            <strong>Settings → Brand → General</strong>. See{" "}
            <Link href="/docs/daily-use/settings">Change settings</Link>.
          </p>
        )}
      </div>
    </aside>
  );
}
