"use client";

import { useI18n } from "@timelish/i18n/client";
import { Check, ChevronsUpDown, X } from "lucide-react";
import React from "react";

import InfiniteScroll from "react-infinite-scroll-component";

import { cn, transformChildrenToString } from "../utils";
import { Button, ButtonProps } from "./button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type IComboboxItem = {
  value: string;
  label: React.ReactNode;
  shortLabel?: React.ReactNode;
  category?: string;
};

type BaseComboboxProps = React.ButtonHTMLAttributes<any> & {
  values: IComboboxItem[];
  searchLabel?: string;
  placeholder?: string;
  noResultsLabel?: string;
  value?: string;
  listClassName?: string;
  useCategories?: boolean;
  customSearch?: (search: string) => IComboboxItem[];
  size?: ButtonProps["size"];
};

type ClearableComboboxProps = BaseComboboxProps & {
  onItemSelect?: (value: string | undefined) => void;
  allowClear: true;
};

type NonClearableComboboxProps = BaseComboboxProps & {
  onItemSelect?: (value: string) => void;
  allowClear?: false;
};

export type ComboboxProps = NonClearableComboboxProps | ClearableComboboxProps;

export const Loader: React.FC = () => {
  const t = useI18n("ui");

  return (
    <div role="status">
      <svg
        aria-hidden="true"
        className="w-14 h-14 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-slate-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="sr-only">{t("loading.loading")}</span>
    </div>
  );
};

const ItemComponent = React.memo(
  (props: {
    item: IComboboxItem;
    selected: string | undefined;
    select: (value: string) => void;
    style?: React.CSSProperties;
  }) => {
    const onSelect = React.useCallback(
      () => props.select(props.item.value),
      [],
    );

    return (
      <CommandItem
        style={props.style}
        onSelect={onSelect}
        className="text-base"
      >
        <Check
          className={cn(
            "mr-2 size-3.5",
            props.selected === props.item.value ? "opacity-100" : "opacity-0",
          )}
        />
        {props.item.label}
      </CommandItem>
    );
  },
);

ItemComponent.displayName = "ItemComponent";

const Items = React.memo(
  (props: {
    values: IComboboxItem[];
    selected: string | undefined;
    listRef: React.RefObject<HTMLDivElement | null>;
    select: (value: string) => void;
    useCategories?: boolean;
  }) => {
    const t = useI18n("ui");
    const toLoad = 20;

    const [loaded, setLoaded] = React.useState(toLoad);
    const hasMore = React.useMemo(
      () => loaded < props.values.length - 1,
      [loaded, props],
    );

    const values = React.useMemo(
      () => props.values.slice(0, loaded),
      [props, loaded],
    );

    const fetchMore = () => {
      setLoaded(loaded + toLoad);
    };

    const [listId, setListId] = React.useState<string | undefined>(undefined);

    React.useEffect(() => {
      if (props.listRef.current) {
        setTimeout(() => {
          setListId(props.listRef.current?.id);
        }, 0);
      }
    }, [props.listRef.current]);

    return listId ? (
      <InfiniteScroll
        dataLength={values.length}
        next={() => fetchMore()}
        hasMore={hasMore}
        loader={<h4>{t("loading.loading")}</h4>}
        scrollableTarget={listId}
      >
        {props.useCategories ? (
          <CommandList>
            {Object.entries(
              props.values.reduce(
                (acc, item) => {
                  if (!acc[item.category || ""] && item.category) {
                    acc[item.category || ""] = [];
                  }
                  acc[item.category || ""].push(item);
                  return acc;
                },
                {} as Record<string, IComboboxItem[]>,
              ),
            ).map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map((item) => (
                  <ItemComponent
                    key={item.value}
                    item={item}
                    selected={props.selected}
                    select={props.select}
                  />
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        ) : (
          props.values.map((item) => (
            <ItemComponent
              key={item.value}
              item={item}
              selected={props.selected}
              select={props.select}
            />
          ))
        )}
      </InfiniteScroll>
    ) : (
      <></>
    );
  },
);
Items.displayName = "Items";

export const ComboboxTrigger = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    allowClear?: boolean;
    onClear?: () => void;
    open?: boolean;
    size?: ButtonProps["size"];
  }
>(({ onClear, allowClear, open, className, children, size, ...props }, ref) => {
  const t = useI18n("ui");

  return (
    <div className={cn("flex-grow inline-flex flex-row", className)}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        size={size}
        {...props}
        ref={ref}
        className={cn(
          "justify-between flex-grow min-w-0 flex-shrink max-md:text-base",
          allowClear ? "rounded-r-none" : "",
        )}
      >
        {children}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {allowClear && (
        <Button
          variant="outline"
          onClick={onClear}
          type="button"
          size={size}
          className="border-l-0 rounded-l-none"
          aria-label={t("common.clear")}
          disabled={props.disabled}
        >
          <X className="h-4 w-4 opacity-50" />
        </Button>
      )}
    </div>
  );
});

ComboboxTrigger.displayName = "ComboboxTrigger";

const defaultSearch = (values: IComboboxItem[], search: string) => {
  return values.filter((value) => {
    const s = search.toLocaleLowerCase();
    const label = transformChildrenToString(value.label);
    const shortLabel = transformChildrenToString(value.shortLabel);
    return (
      label.toLocaleLowerCase().includes(s) ||
      shortLabel.toLocaleLowerCase().includes(s) ||
      value.value.toLocaleLowerCase().includes(s)
    );
  });
};

export const Combobox: React.FC<ComboboxProps> = (props) => {
  const t = useI18n("ui");
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string | undefined>(props.value);
  React.useEffect(() => {
    setValue(props.value);
  }, [props.value, setValue]);

  const [search, setSearch] = React.useState("");

  let {
    listClassName,
    customSearch,
    placeholder,
    searchLabel,
    onItemSelect,
    className,
    ...rest
  } = props;
  searchLabel = searchLabel || t("common.search");
  let buttonLabel: React.ReactNode = placeholder || t("common.search");
  if (value) {
    const selected = props.values.find((val) => val.value === value);
    buttonLabel = selected?.shortLabel || selected?.label || buttonLabel;
  }

  const onSelect = React.useCallback(
    (value: string | undefined) => {
      setValue(value);
      setOpen(false);
      onItemSelect?.(value as string);
    },
    [props],
  );

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    setSearch("");
  };

  const propsValues = props.values;
  const values = React.useMemo(
    () =>
      customSearch ? customSearch(search) : defaultSearch(propsValues, search),
    [customSearch, search, propsValues],
  );

  const listId = React.useId();

  const listRef = React.createRef<HTMLDivElement>();

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal>
      <PopoverTrigger asChild>
        <ComboboxTrigger
          allowClear={"allowClear" in props && props.allowClear}
          onClear={() => onSelect(undefined)}
          open={open}
          className={className}
          {...rest}
        >
          {buttonLabel}
        </ComboboxTrigger>
      </PopoverTrigger>
      <PopoverContent
        className={"min-w-max p-0 w-[var(--radix-popper-anchor-width)]"}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchLabel}
            value={search}
            onValueChange={setSearch}
            className="text-base"
          />
          {(!values || values.length) == 0 && (
            <div className="py-6 text-center text-sm">
              {props.noResultsLabel || t("common.noResults")}
            </div>
          )}
          <CommandList
            className={cn("max-h-60", listClassName)}
            id={listId}
            ref={listRef}
          >
            <Items
              values={values}
              selected={value}
              select={onSelect}
              listRef={listRef}
              useCategories={props.useCategories}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
