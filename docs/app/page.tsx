import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";

export const metadata: Metadata = {
  title: "Hacado Docs",
  description:
    "Hacado is an all-in-one appointment booking platform. Start with the guides to set up your workspace and take your first booking.",
};

export default function Page() {
  return <HomePage />;
}
