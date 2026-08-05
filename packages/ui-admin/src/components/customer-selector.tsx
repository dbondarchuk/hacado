"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  CustomerListModel,
  getCustomerSchemaWithUniqueCheck,
} from "@hacado/types";
import {
  Button,
  cn,
  ComboboxAsync,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IComboboxItem,
  Input,
  PhoneInput,
  Skeleton,
  Spinner,
  toastPromise,
  useDebounceCacheFn,
} from "@hacado/ui";
import { PlusCircle } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CustomerName } from "./data-table/customer-name";

const CustomerShortLabel: React.FC<{
  customer: CustomerListModel;
  row?: boolean;
}> = ({ customer, row }) => {
  return (
    <div className="flex flex-row items-center gap-2 shrink overflow-hidden text-nowrap min-w-0 max-w-[var(--radix-popover-trigger-width)]">
      <img
        src={customer.avatar ?? "/unknown-person.png"}
        alt={customer.name}
        className="w-5 h-5 object-cover"
      />
      <div className={cn("flex gap-0.5", row ? "items-baseline" : "flex-col")}>
        <CustomerName customer={customer} />
        {!customer.isDeleted && (
          <>
            <span className="text-xs italic">{customer.email}</span>
            <span className="text-xs italic">{customer.phone}</span>
          </>
        )}
      </div>
    </div>
  );
};

const CustomerLoader: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-row items-center gap-2 overflow-hidden text-nowrap pl-6 w-full">
      <Skeleton className="w-5 h-5 rounded-full" />
      <div className="flex gap-0.5 flex-col w-full">
        <Skeleton className="min-w-40 max-w-96 w-full h-5" />
        <Skeleton className="min-w-36 max-w-80 w-full h-4" />
        <Skeleton className="min-w-36 max-w-80 w-full h-4" />
      </div>
    </div>
  );
};

type BaseCustomerSelectorProps = {
  value?: string;
  disabled?: boolean;
  className?: string;
  onValueChange?: (customer?: CustomerListModel) => void;
};

type ClearableCustomerSelectorProps = BaseCustomerSelectorProps & {
  onItemSelect: (value: string | undefined) => void;
  allowClear: true;
};

type NonClearableCustomerSelectorProps = BaseCustomerSelectorProps & {
  onItemSelect: (value: string) => void;
  allowClear?: false;
};

export type CustomerSelectorProps =
  | NonClearableCustomerSelectorProps
  | ClearableCustomerSelectorProps;

const AddNewCustomerItem: React.FC<{ onCreated: (value: string) => void }> = ({
  onCreated,
}) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const t = useI18n("admin");

  const customerUniqueCheck = useDebounceCacheFn(
    adminApi.customers.checkCustomerUniqueEmailAndPhone,
    300,
  );

  const formSchema = getCustomerSchemaWithUniqueCheck(
    (emails, phones) => customerUniqueCheck(emails, phones),
    "customers.emailAlreadyExists",
    "customers.phoneAlreadyExists",
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      knownNames: [],
      knownEmails: [],
      knownPhones: [],
      requireDeposit: "inherit",
    },
  });

  const isValid = form.formState.isValid;

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const fn = async () => {
        const customer = await adminApi.customers.createCustomer(data);
        onCreated(customer._id);
      };
      await toastPromise(fn(), {
        success: t("customers.toasts.customerCreated"),
        error: t("common.toasts.error"),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex flex-row items-center gap-2 justify-start"
        >
          <PlusCircle className="ml-4 w-5 h-5" /> {t("customerSelector.addNew")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("customerSelector.dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("customerSelector.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-2"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("customerSelector.dialog.form.name")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("customerSelector.dialog.form.email")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} disabled={loading} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("customerSelector.dialog.form.phone")}
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        label={t("customerSelector.dialog.form.phone")}
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{t("common.buttons.close")}</Button>
          </DialogClose>
          <Button
            disabled={loading || !isValid}
            onClick={form.handleSubmit(onSubmit)}
          >
            {loading ? <Spinner /> : <PlusCircle />}{" "}
            {t("customerSelector.dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  disabled,
  className,
  value,
  onItemSelect,
  onValueChange,
  allowClear,
}) => {
  const t = useI18n("admin");
  const [itemsCache, setItemsCache] = React.useState<
    Record<string, CustomerListModel>
  >({});

  const getCustomers = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.customers.getCustomers({
        page,
        limit,
        search,
        priorityId: value ? [value] : undefined,
      });

      setItemsCache((prev) => ({
        ...prev,
        ...result.items.reduce(
          (map, cur) => ({
            ...map,
            [cur._id]: cur,
          }),
          {} as typeof itemsCache,
        ),
      }));

      return {
        items: result.items.map((customer) => ({
          label: <CustomerShortLabel customer={customer} />,
          shortLabel: <CustomerShortLabel customer={customer} row />,
          value: customer._id,
        })) satisfies IComboboxItem[],
        hasMore: page * limit < result.total,
      };
    },
    [value, setItemsCache, t],
  );

  React.useEffect(() => {
    onValueChange?.(value ? itemsCache[value] : undefined);
  }, [value, itemsCache]);

  return (
    <ComboboxAsync
      // @ts-ignore Allow clear passthrough
      onChange={onItemSelect}
      disabled={disabled}
      className={cn("flex font-normal text-base max-w-full min-w-0", className)}
      placeholder={t("customerSelector.placeholder")}
      value={value}
      allowClear={allowClear}
      fetchItems={getCustomers}
      loader={<CustomerLoader />}
      addNewItem={AddNewCustomerItem}
    />
  );
};
