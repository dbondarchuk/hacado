"use client";
import { BrandConfiguration } from "@hacado/types/configuration/brand";
import { GeneralConfiguration } from "@hacado/types/configuration/general";
import type { TextMessagingConfig } from "@hacado/types/text-message/registration";
import { CurrencySymbolMap } from "@hacado/types/utils";
import { formatAmountWithCurrency } from "@hacado/utils/currency";
import { createContext, useContext } from "react";

const disabledTextMessaging: TextMessagingConfig = { enabled: false };

export type SmsLinkShorteningConfig = {
  enabled: boolean;
  shortDomain: string;
};

const disabledSmsLinkShortening: SmsLinkShorteningConfig = {
  enabled: false,
  shortDomain: "haca.do",
};

export const TextMessagingContext = createContext<TextMessagingConfig | null>(
  null,
);

export const TextMessagingProvider = ({
  value,
  children,
}: {
  value: TextMessagingConfig;
  children: React.ReactNode;
}) => (
  <TextMessagingContext.Provider value={value}>
    {children}
  </TextMessagingContext.Provider>
);

export const ConfigContext = createContext<{
  config: GeneralConfiguration &
    BrandConfiguration & { domain: string | null | undefined };
  websiteUrl: string;
  textMessaging: TextMessagingConfig;
  smsLinkShortening: SmsLinkShorteningConfig;
}>({
  config: {
    name: "",
    title: "",
    description: "",
    keywords: "",
    email: "",
    domain: "",
    language: "en",
    timeZone: "UTC",
    currency: "USD",
    country: "US",
    useClientTimezone: false,
  },
  websiteUrl: "",
  textMessaging: disabledTextMessaging,
  smsLinkShortening: disabledSmsLinkShortening,
});

export const ConfigProvider = ({
  children,
  generalConfiguration,
  brandConfiguration,
  domain,
  websiteUrl,
  textMessaging = disabledTextMessaging,
  smsLinkShortening = disabledSmsLinkShortening,
}: {
  children: React.ReactNode;
  generalConfiguration: GeneralConfiguration;
  brandConfiguration: BrandConfiguration;
  domain: string | null | undefined;
  websiteUrl: string;
  textMessaging?: TextMessagingConfig;
  smsLinkShortening?: SmsLinkShorteningConfig;
}) => {
  return (
    <ConfigContext.Provider
      value={{
        config: { ...generalConfiguration, ...brandConfiguration, domain },
        websiteUrl,
        textMessaging,
        smsLinkShortening,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  return useContext(ConfigContext).config;
};

export const useWebsiteUrl = () => {
  return useContext(ConfigContext).websiteUrl;
};

export const useTextMessaging = () => {
  const override = useContext(TextMessagingContext);
  return override ?? useContext(ConfigContext).textMessaging;
};

export const useSmsLinkShortening = () => {
  return useContext(ConfigContext).smsLinkShortening;
};

export const useTimeZone = () => {
  const config = useConfig();
  return config.timeZone;
};

export const useUseClientTimezone = () => {
  const config = useConfig();
  return config.useClientTimezone;
};

export const useCurrency = () => {
  const config = useConfig();
  return config.currency;
};

export const useCurrencySymbol = () => {
  const config = useConfig();
  return CurrencySymbolMap[config.currency];
};

export const useCurrencyFormat = () => {
  const config = useConfig();
  return (amount: number) =>
    formatAmountWithCurrency(amount, config.language, config.currency);
};
