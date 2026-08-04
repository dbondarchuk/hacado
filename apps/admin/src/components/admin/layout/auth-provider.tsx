import { authClient } from "@/app/auth-client";
import type { SessionUser } from "@timelish/types";
import { AuthContext } from "@timelish/ui-admin";
import { useMemo } from "react";

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { data, isPending, isRefetching, error, refetch } =
    authClient.useSession();
  const value = useMemo(
    () => ({
      user: (data?.user ?? {}) as SessionUser,
      isLoading: isPending,
      refetch,
    }),
    [data, isPending, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
