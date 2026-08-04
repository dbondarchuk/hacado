"use client";

import { useI18n } from "@timelish/i18n/client";
import { SocialLink } from "@timelish/types";
import { Sortable } from "@timelish/ui-admin";
import React from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { SiteSettingsFormValues } from "../site-settings-schema";
import { SocialLinkCard } from "../social-link-card";

export const SocialTab: React.FC<{
  form: UseFormReturn<SiteSettingsFormValues>;
  loading: boolean;
}> = ({ form, loading }) => {
  const t = useI18n("admin");
  const {
    fields: links,
    append: appendLink,
    remove: removeLink,
    swap: swapLinks,
  } = useFieldArray({
    control: form.control,
    name: "social.links",
    keyName: "fields_id",
  });

  const linksIds = React.useMemo(() => links.map((c) => c.fields_id), [links]);

  const addNewLink = () => {
    appendLink({
      url: "",
    } as Partial<SocialLink> as SocialLink);
  };

  const sort = (activeId: string, overId: string) => {
    const activeIndex = links.findIndex((x) => x.fields_id === activeId);
    const overIndex = links.findIndex((x) => x.fields_id === overId);
    if (activeIndex < 0 || overIndex < 0) return;
    swapLinks(activeIndex, overIndex);
  };

  return (
    <Sortable
      title={t("settings.social.form.socialLinks")}
      ids={linksIds}
      onAdd={addNewLink}
      onSort={sort}
    >
      <div className="flex flex-grow flex-col gap-4">
        {links.map((link, index) => (
          <SocialLinkCard
            form={form}
            item={link}
            key={link.fields_id}
            name={`social.links.${index}`}
            disabled={loading}
            remove={() => removeLink(index)}
          />
        ))}
      </div>
    </Sortable>
  );
};
