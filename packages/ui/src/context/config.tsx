"use client";
import {
  BrandConfiguration,
  CurrencySymbolMap,
  GeneralConfiguration,
} from "@hacado/types";
import { formatAmountWithCurrency } from "@hacado/utils";
import { createContext, useContext } from "react";

export const ConfigContext = createContext<{
  config: GeneralConfiguration &
    BrandConfiguration & { domain: string | null | undefined };
  websiteUrl: string;
}>({
  config: {
    name: "",
    title: "",
    description: "",
    keywords: "",
    email: "",
    domain: "",
    language: "en",
    timeZone: "local",
    currency: "USD",
    country: "US",
    useClientTimezone: false,
  },
  websiteUrl: "",
});

export const ConfigProvider = ({
  children,
  generalConfiguration,
  brandConfiguration,
  domain,
  websiteUrl,
}: {
  children: React.ReactNode;
  generalConfiguration: GeneralConfiguration;
  brandConfiguration: BrandConfiguration;
  domain: string | null | undefined;
  websiteUrl: string;
}) => {
  return (
    <ConfigContext.Provider
      value={{
        config: { ...generalConfiguration, ...brandConfiguration, domain },
        websiteUrl,
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
