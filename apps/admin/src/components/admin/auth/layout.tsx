import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hacado/ui";
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
    <div className="min-h-screen overflow-y-auto bg-muted">
      <div className="flex min-h-screen flex-col items-center justify-center p-4 py-8 lg:p-8">
        <Card className="w-full max-w-md shrink-0 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="flex gap-2 items-center justify-center mb-4 mx-auto">
              <div className="text-3xl font-semibold tracking-tight text-balance font-display text-primary">
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
