"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  formatPostalAddress,
  type AddressSuggestion,
  type Country,
  type PostalAddress,
} from "@hacado/types";
import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Loader,
  useDebounce,
} from "@hacado/ui";
import React from "react";

export type AddressAutocompleteProps = {
  disabled?: boolean;
  className?: string;
  /** Soft-ranks Geoapify results toward this country. */
  countryBias?: Country | null;
  onSelect: (address: PostalAddress) => void;
};

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  disabled,
  className,
  countryBias,
  onSelect,
}) => {
  const t = useI18n("ui");
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [items, setItems] = React.useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const onSelectRef = React.useRef(onSelect);
  onSelectRef.current = onSelect;

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setItems([]);
      setLoading(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const query = debouncedSearch.trim();
    if (query.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const result = await adminApi.addresses.getAddressSuggestions({
          page: 1,
          limit: 10,
          search: query,
          country: countryBias || undefined,
        });
        if (cancelled) return;
        setItems(result.items);
      } catch {
        if (cancelled) return;
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, debouncedSearch, countryBias]);

  const handleSelect = (suggestion: AddressSuggestion) => {
    const { id: _id, ...address } = suggestion;
    onSelectRef.current(address);
    setOpen(false);
  };

  return (
    <div className={cn("md:col-span-2", className)}>
      <p className="text-sm text-muted-foreground">
        {t("addressAutocomplete.description")}{" "}
        <Button
          type="button"
          variant="link"
          size="none"
          disabled={disabled}
          className="h-auto p-0 text-sm font-normal"
          onClick={() => setOpen(true)}
        >
          {t("addressAutocomplete.findAddress")}
        </Button>
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 gap-0 sm:max-w-lg">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>{t("addressAutocomplete.title")}</DialogTitle>
            <DialogDescription>
              {t("addressAutocomplete.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <Command shouldFilter={false} className="rounded-none border-t">
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={t("addressAutocomplete.search")}
            />
            <CommandList className="max-h-[min(50vh,20rem)]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader />
                </div>
              ) : debouncedSearch.trim().length < 2 ? (
                <CommandEmpty>
                  {t("addressAutocomplete.minCharacters")}
                </CommandEmpty>
              ) : items.length === 0 ? (
                <CommandEmpty>{t("addressAutocomplete.empty")}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {items.map((item) => {
                    const label = formatPostalAddress(item);
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => handleSelect(item)}
                        className="flex flex-col items-start gap-0.5 py-2.5"
                      >
                        <span className="font-medium">
                          {formatSuggestionPrimary(item)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {label}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function formatSuggestionPrimary(address: AddressSuggestion): string {
  const street = [address.streetAddress, address.addressLine2]
    .filter(Boolean)
    .join(", ");
  return street || formatPostalAddress(address);
}
