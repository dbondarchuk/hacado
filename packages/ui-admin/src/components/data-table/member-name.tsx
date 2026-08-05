import { Avatar, AvatarFallback, AvatarImage, cn } from "@hacado/ui";
import React from "react";

export type MemberNameMember = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function memberInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

export const MemberName: React.FC<{
  member?: MemberNameMember | null;
  empty?: React.ReactNode;
  className?: string;
  /** Smaller avatar + name only (no email). */
  compact?: boolean;
}> = ({ member, empty = "—", className, compact = false }) => {
  if (!member) return <>{empty}</>;

  const name = member.name || member.email || "—";

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5 min-w-0", className)}>
        <Avatar className="size-5 shrink-0">
          <AvatarImage src={member.image ?? undefined} alt={name} />
          <AvatarFallback className="text-[10px] bg-white/90 text-current">
            {memberInitials(name)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-xs font-medium">{name}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <Avatar className="size-7">
        <AvatarImage src={member.image ?? undefined} alt={name} />
        <AvatarFallback className="text-xs">
          {memberInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex flex-col">
        <span className="truncate font-medium">{name}</span>
        {member.name && member.email ? (
          <span className="truncate text-xs text-muted-foreground">
            {member.email}
          </span>
        ) : null}
      </div>
    </div>
  );
};
