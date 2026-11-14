"use client";

import {
  useCurrentModal,
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
  const currentModal = useCurrentModal();

  if (type === "action") {
    const { action, actionData, ...rest } = props as ButtonProps["props"] & {
      type: "action";
    };

    const onClick = () => {
      const modalId = actionData?.modalId as string | undefined;

      if (action === "open-modal") {
        if (!modalId || !readerContext) return;

        readerContext.modal.open(modalId);
        return;
      }

      if (action === "close-modal") {
        if (modalId && readerContext) {
          readerContext.modal.close(modalId);
          return;
        }

        currentModal?.setIsOpen(false);
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
