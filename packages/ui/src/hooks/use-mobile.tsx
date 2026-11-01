import React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(context?: Window | null) {
  const windowContext =
    context ||
    (typeof window !== "undefined"
      ? window
      : ({
          matchMedia: () => ({
            addEventListener: () => {},
            removeEventListener: () => {},
          }),
          innerWidth: 0,
        } as unknown as Window));

  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = windowContext.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );

    const onChange = () => {
      setIsMobile(windowContext.innerWidth < MOBILE_BREAKPOINT);
    };

    mql.addEventListener("change", onChange);
    setIsMobile(windowContext.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, [windowContext]);

  return !!isMobile;
}
