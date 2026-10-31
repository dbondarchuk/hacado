"use client";
import { useI18n } from "./client";
import { richTextArgs } from "./rich-text-args";
import { I18nKey, I18nNamespaces } from "./types-core";

export const I18nText = <T extends I18nNamespaces>({
  namespace,
  text,
  args,
}: {
  namespace?: T;
  text: I18nKey<T>;
  args?: Record<string, any>;
}) => {
  const t = useI18n(namespace);
  return t(text, args);
};

export const I18nRichText = <T extends I18nNamespaces>({
  namespace,
  text,
  args,
}: {
  namespace?: T;
  text: I18nKey<T>;
  args?: Record<string, any>;
}) => {
  const t = useI18n(namespace);

  return t.rich(text, { ...richTextArgs, ...args });
};
