"use client";

import {
  useCurrentBanner,
  useCurrentPopup,
  useReaderContext,
} from "@hacado/page-builder-base/reader";
import { ButtonProps } from "./schema";

type Props = Omit<NonNullable<ButtonProps["props"]>, "children"> & {
  className?: string;
  id?: string;
  children: React.ReactNode;
};

export const Button = ({ children, type, ...props }: Props) => {
  const readerContext = useReaderContext();
  const currentPopup = useCurrentPopup();
  const currentBanner = useCurrentBanner();

  if (type === "action") {
    const { action, actionData, ...rest } = props as ButtonProps["props"] & {
      type: "action";
    };
    const onClick = () => {
      if (action === "open-popup") {
        const popupId = actionData?.popupId;
        if (popupId && readerContext) {
          readerContext.popup.openPopup(popupId);
        }
      } else if (action === "close-current-popup") {
        if (currentPopup) {
          currentPopup.setIsOpen(false);
        }
      } else if (action === "open-banner") {
        const bannerId = actionData?.bannerId;
        if (bannerId && readerContext) {
          readerContext.banner.openBanner(bannerId);
        }
      } else if (action === "close-current-banner") {
        if (currentBanner) {
          currentBanner.setIsOpen(false);
        }
      }
    };

    return (
      <button {...rest} onClick={onClick} type="button">
        {children}
      </button>
    );
  }

  const {
    url: href,
    target,
    ...rest
  } = props as ButtonProps["props"] & {
    type: "link";
  };

  return (
    <a href={href || "/"} target={target ?? undefined} {...rest}>
      {children}
    </a>
  );
};
