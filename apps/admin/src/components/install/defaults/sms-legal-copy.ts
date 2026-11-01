import type { I18nFn } from "@hacado/i18n";

export type SmsLegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: { title: string; paragraphs: string[] }[];
};

type InstallT = I18nFn<"install">;

export const smsLegalCopy = (
  t: InstallT,
  businessName: string,
  date: string,
  kind: "privacy" | "terms",
): SmsLegalDocument => {
  const name =
    businessName.trim() || t("wizard.finish.pageDefaults.legalFallbackName");

  const args = { businessName: name, date };
  if (kind === "privacy") {
    return {
      title: t("wizard.finish.pageDefaults.privacy.title"),
      updated: t("wizard.finish.pageDefaults.privacy.updated", args),
      intro: t("wizard.finish.pageDefaults.privacy.intro", args),
      sections: [
        {
          title: t("wizard.finish.pageDefaults.privacy.collectTitle"),
          paragraphs: [t("wizard.finish.pageDefaults.privacy.collectBody")],
        },
        {
          title: t("wizard.finish.pageDefaults.privacy.useTitle"),
          paragraphs: [t("wizard.finish.pageDefaults.privacy.useBody")],
        },
        {
          title: t("wizard.finish.pageDefaults.privacy.smsTitle"),
          paragraphs: [
            t("wizard.finish.pageDefaults.privacy.smsConsent"),
            t("wizard.finish.pageDefaults.privacy.smsUse"),
          ],
        },
        {
          title: t("wizard.finish.pageDefaults.privacy.contactTitle"),
          paragraphs: [t("wizard.finish.pageDefaults.privacy.contactBody")],
        },
      ],
    };
  }

  return {
    title: t("wizard.finish.pageDefaults.terms.title"),
    updated: t("wizard.finish.pageDefaults.terms.updated", args),
    intro: t("wizard.finish.pageDefaults.terms.intro", args),
    sections: [
      {
        title: t("wizard.finish.pageDefaults.terms.bookingsTitle"),
        paragraphs: [t("wizard.finish.pageDefaults.terms.bookingsBody")],
      },
      {
        title: t("wizard.finish.pageDefaults.terms.smsTitle"),
        paragraphs: [
          t("wizard.finish.pageDefaults.terms.smsConsent", args),
          t("wizard.finish.pageDefaults.terms.smsFrequency"),
          t("wizard.finish.pageDefaults.terms.smsRates"),
          t("wizard.finish.pageDefaults.terms.smsStop"),
          t("wizard.finish.pageDefaults.terms.smsHelp"),
          t("wizard.finish.pageDefaults.terms.smsCarriers"),
        ],
      },
      {
        title: t("wizard.finish.pageDefaults.terms.platformTitle"),
        paragraphs: [t("wizard.finish.pageDefaults.terms.platformBody")],
      },
    ],
  };
};
