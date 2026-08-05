import { getI18nAsync } from "@hacado/i18n/server";
import { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  _: any,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const parentTitle = (await parent).title?.template?.replace("%s |", "");
  return {
    title: {
      template: `%s | ${t("navigation.settings")} | ${parentTitle}`,
      default: t("navigation.settings"),
    },
  };
}

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
