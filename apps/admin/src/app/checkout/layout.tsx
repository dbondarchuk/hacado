import { ScrollArea } from "@hacado/ui/scroll-area";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ScrollArea className="h-[100svh] w-full">{children}</ScrollArea>;
}
