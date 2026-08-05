"use client";

import type { SessionUser } from "@hacado/types";
import { createContext, useContext } from "react";

export type AuthContextProps = {
  user: SessionUser;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextProps>(
  {} as AuthContextProps,
);

export const useAuth = () => {
  return useContext(AuthContext);
};
