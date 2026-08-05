import { ScrollArea } from "@hacado/ui";

export default function InstallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ScrollArea className="h-[100svh] w-full">{children}</ScrollArea>;
}
