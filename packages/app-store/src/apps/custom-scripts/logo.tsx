import type { AppLogoProps } from "@hacado/types/apps";
import { Code2 } from "lucide-react";

export function CustomScriptsLogo({ className }: AppLogoProps) {
  return <Code2 className={className} aria-hidden />;
}
