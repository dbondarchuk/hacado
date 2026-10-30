"use client";
import { cn } from "@hacado/ui/cn";
import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

export const HeaderActionButtonsContext = createContext<{
  containerRef: HTMLDivElement | null;
  setContainerRef: (ref: HTMLDivElement | null) => void;
}>({
  containerRef: null,
  setContainerRef: () => {},
});

const useContainerRef = () => {
  const { containerRef } = useContext(HeaderActionButtonsContext);
  return containerRef;
};

export const HeaderActionButtonsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  return (
    <HeaderActionButtonsContext.Provider
      value={{ containerRef, setContainerRef }}
    >
      {children}
    </HeaderActionButtonsContext.Provider>
  );
};

export const HeaderActionButtonsContainer: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { setContainerRef } = useContext(HeaderActionButtonsContext);

  return (
    <div
      ref={(node) => {
        if (node) setContainerRef(node);
      }}
      className={cn(
        "flex flex-row gap-2 items-center",
        "empty:hidden",
        className,
      )}
    />
  );
};

export const HeaderActionButtonsPortal: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const containerRef = useContainerRef();

  if (!containerRef?.isConnected) return null;
  return createPortal(children, containerRef);
};
