import countries from "countries-phone-masks";
import React from "react";
import { Mask, MaskedInput } from "./masked-input";

import { countryOptions } from "@hacado/types";
import { cn } from "../utils";
import { Combobox } from "./combobox";
import "./css/flags.css";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupInputClasses,
} from "./input-group";

export type PhoneInputProps = {
  label: string;
  defaultCountry?: string;
  value?: string;
  onChange?: (value: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
};

export const PhoneInput: React.FC<PhoneInputProps> = ({
  disabled,
  label,
  className,
  defaultCountry = "US",
  inputClassName,
  ...props
}) => {
  const [mask, setMask] = React.useState<Mask | undefined>(undefined);
  const [maskPlaceholder, setMaskPlaceholder] = React.useState<
    string | undefined
  >(undefined);

  const onCountryChange = (iso: string) => {
    const country = countries.find((c) => c.iso === iso);
    const countryMask =
      country?.mask && Array.isArray(country?.mask)
        ? country?.mask[0]
        : (country?.mask as string);

    const maskPlaceholder = countryMask
      ? `${country?.code} ${countryMask?.replaceAll("#", "_")}`
      : "";
    const mask = countryMask
      ? `${country?.code} ${countryMask}`
          .split("")
          .map((c) => (c === "#" ? /[0-9]/ : c))
      : undefined;

    setMask(mask);
    setMaskPlaceholder(maskPlaceholder);
  };

  React.useEffect(() => onCountryChange(defaultCountry), [defaultCountry]);

  const allowedCountries = React.useMemo(
    () =>
      countries.filter((c) =>
        countryOptions.some((co) => co.toLowerCase() === c.iso.toLowerCase()),
      ),
    [],
  );

  const countryTransform = (country: (typeof countries)[number]) => ({
    value: country.iso,
    shortLabel: (
      <div title={country.name} className="flex">
        <label className="sr-only">{country.name}</label>
        <div
          className={`self-center mr-2 flag ${country.iso.toLocaleLowerCase()}`}
        ></div>
        <div>{country.code}</div>
      </div>
    ),
    label: (
      <div title={country.name} className="flex justify-between w-full">
        <div className="flex">
          <div
            className={`self-center mr-2 flag ${country.iso.toLocaleLowerCase()}`}
          ></div>
          <label>{country.name}</label>
        </div>
        <div>{country.code}</div>
      </div>
    ),
  });

  const countryList = React.useMemo(
    () => allowedCountries.map(countryTransform),
    [allowedCountries],
  );

  return (
    <InputGroup className={className}>
      <InputGroupAddon className="border-r-0 rounded-r-none">
        <label htmlFor="countryCode" className="sr-only">
          {label}
        </label>
        <Combobox
          disabled={disabled}
          className="*:border-r-0 *:rounded-r-none focus:ring-0 min-w-fit"
          value={defaultCountry}
          onItemSelect={(value: string) => onCountryChange(value)}
          values={countryList}
          listClassName="w-[400px]"
          searchLabel={label}
          customSearch={(search) => {
            const lowerSearch = search.toLocaleLowerCase();
            return allowedCountries
              .filter(
                (c) =>
                  c.name.toLocaleLowerCase().indexOf(lowerSearch) >= 0 ||
                  c.iso.toLocaleLowerCase().indexOf(lowerSearch) >= 0 ||
                  c.code.toLocaleLowerCase().indexOf(lowerSearch) >= 0,
              )
              .map(countryTransform);
          }}
        />
      </InputGroupAddon>
      <InputGroupInput>
        <MaskedInput
          {...props}
          disabled={disabled}
          mask={mask}
          className={cn(
            InputGroupInputClasses({ variant: "prefix" }),
            inputClassName,
          )}
          placeholder={maskPlaceholder}
        />
      </InputGroupInput>
    </InputGroup>
  );
};
