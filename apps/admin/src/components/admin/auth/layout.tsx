import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hacado/ui/card";
import { Suspense } from "react";

export const AuthLayout = ({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-muted overscroll-y-contain">
      <div className="flex min-h-full flex-col items-center justify-center p-4 py-8 lg:p-8">
        <Card className="w-full max-w-md shrink-0 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center gap-2 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                className="size-8 shrink-0"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M 80 28 L 176 28 A 52 52 0 0 1 228 80 L 228 150 A 78 78 0 0 0 150 228 L 80 228 A 52 52 0 0 1 28 176 L 28 80 A 52 52 0 0 1 80 28 Z"
                />
              </svg>
              <div className="font-display text-3xl font-semibold tracking-tight text-balance">
                hacado
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-balance">
              {title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground text-balance">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>{children}</Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
