import { ScrollArea } from "@hacado/ui";

export default function InstallWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ScrollArea className="h-[100svh] w-full">{children}</ScrollArea>;
}
