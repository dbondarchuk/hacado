"use client";

import { customersApi } from "@hacado/api-sdk/admin/customers";
import { useI18n } from "@hacado/i18n/client";
import {
  CustomerUpdateModel,
  getCustomerSchemaWithUniqueCheck,
} from "@hacado/types/customers";
import { DatabaseId } from "@hacado/types/database";
import { AssetSelectorDialog } from "@hacado/ui-admin/assets-selector-dialog";
import { useAuth } from "@hacado/ui-admin/context";
import { SaveButton } from "@hacado/ui-admin/save-button";
import { SwitchCardFormItem } from "@hacado/ui-admin/switch-card-form-item";
import { Button } from "@hacado/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@hacado/ui/card";
import { cn } from "@hacado/ui/cn";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { useDebounceCacheFn } from "@hacado/ui/hooks";
import { Input } from "@hacado/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "@hacado/ui/input-group";
import { PhoneInput } from "@hacado/ui/phone-input";
import {
  RadioButtonGroup,
  RadioButtonGroupItem,
} from "@hacado/ui/radio-button-group";
import { toastPromise } from "@hacado/ui/sonner";
import { Switch } from "@hacado/ui/switch";
import { Textarea } from "@hacado/ui/textarea";
import { DateTimeInput } from "@hacado/ui/time-picker";
import { hasPermission } from "@hacado/utils/permissions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { Control, FieldPath, useForm } from "react-hook-form";
import * as z from "zod";

type KnownFieldName = "knownNames" | "knownEmails" | "knownPhones";

const depositOptions = ["never", "always", "inherit"] as const;

function customerInitials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "";

  const letters =
    parts.length === 1
      ? parts[0].slice(0, 2)
      : `${parts[0][0]}${parts[parts.length - 1][0]}`;

  return letters.toUpperCase();
}

function CustomerAvatar({
  name,
  src,
  alt,
  className,
}: {
  name?: string | null;
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const initials = customerInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground",
        className,
      )}
    >
      {initials || <User className="size-5" aria-hidden />}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-1 border-b">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        {description ? (
          <p className="text-sm font-normal normal-case tracking-normal text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className={cn("pt-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

function KnownValuesEditor({
  control,
  name,
  label,
  addLabel,
  removeLabel,
  placeholder,
  kind,
  disabled,
  values,
  onChange,
}: {
  control: Control<CustomerUpdateModel>;
  name: KnownFieldName;
  label: string;
  addLabel: string;
  removeLabel: string;
  placeholder: string;
  kind: "text" | "email" | "phone";
  disabled?: boolean;
  values: string[];
  onChange: (values: string[], validate?: boolean) => void;
}) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const items = values || [];

  const removeAt = (index: number) => {
    onChange(
      items.filter((_, itemIndex) => itemIndex !== index),
      true,
    );
    setEditingIndex((current) => {
      if (current === null || current === index) return null;
      if (current > index) return current - 1;

      return current;
    });
  };

  const add = () => {
    const emptyIndex = items.findIndex((value) => !value);

    if (emptyIndex >= 0) {
      setEditingIndex(emptyIndex);
      return;
    }

    onChange([...items, ""]);
    setEditingIndex(items.length);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((value, index) => {
          const editing = editingIndex === index || !value;

          return (
            <FormField
              key={`${name}-${index}`}
              control={control}
              name={`${name}.${index}` as FieldPath<CustomerUpdateModel>}
              render={({ field, fieldState }) =>
                editing ? (
                  <FormItem
                    className={cn(
                      "flex flex-wrap items-center gap-1",
                      kind === "phone" && "w-full",
                    )}
                  >
                    <FormControl>
                      {kind === "phone" ? (
                        <PhoneInput
                          label={placeholder}
                          disabled={disabled}
                          className="min-w-0 flex-1"
                          value={field.value as string}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter") return;

                            event.preventDefault();
                            if (field.value) setEditingIndex(null);
                          }}
                        />
                      ) : (
                        <Input
                          autoFocus
                          type={kind === "email" ? "email" : "text"}
                          disabled={disabled}
                          placeholder={placeholder}
                          className="h-8 w-44 rounded-full"
                          value={(field.value as string) ?? ""}
                          onChange={field.onChange}
                          onBlur={() => {
                            field.onBlur();
                            if (!String(field.value ?? "").trim()) {
                              removeAt(index);
                              return;
                            }

                            setEditingIndex(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              event.currentTarget.blur();
                            }
                          }}
                        />
                      )}
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground"
                      disabled={disabled}
                      aria-label={removeLabel}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => removeAt(index)}
                    >
                      <X />
                    </Button>
                    <FormMessage className="basis-full" />
                  </FormItem>
                ) : (
                  <FormItem className="w-auto">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full bg-muted py-1 pl-3 pr-1 text-sm",
                        fieldState.error && "ring-1 ring-destructive",
                      )}
                    >
                      <button
                        type="button"
                        className="max-w-64 truncate"
                        disabled={disabled}
                        onClick={() => setEditingIndex(index)}
                      >
                        {value}
                      </button>
                      <button
                        type="button"
                        className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                        disabled={disabled}
                        aria-label={removeLabel}
                        onClick={() => removeAt(index)}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                    <FormMessage />
                  </FormItem>
                )
              }
            />
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full border-dashed font-normal text-muted-foreground"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={add}
        >
          <Plus />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

export const CustomerForm: React.FC<{
  initialData?: CustomerUpdateModel &
    Partial<DatabaseId> & { isDeleted?: boolean };
  smsConsent?: React.ReactNode;
}> = ({ initialData, smsConsent }) => {
  const t = useI18n("admin");
  const { user } = useAuth();
  const isEditing = Boolean(initialData?._id);
  const canSave = isEditing
    ? hasPermission(user, "customer", "update")
    : hasPermission(user, "customer", "create");

  const customerUniqueCheck = useDebounceCacheFn(
    customersApi.checkCustomerUniqueEmailAndPhone,
    300,
  );

  const formSchema = getCustomerSchemaWithUniqueCheck(
    (emails, phones) => customerUniqueCheck(emails, phones, initialData?._id),
    "customers.emailAlreadyExists",
    "customers.phoneAlreadyExists",
  );

  type FormValues = z.infer<typeof formSchema>;

  const [loading, setLoading] = React.useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = React.useState(false);

  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: !initialData?.isDeleted ? zodResolver(formSchema) : undefined,
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {
      knownNames: [],
      knownEmails: [],
      knownPhones: [],
      requireDeposit: "inherit",
    },
  });

  const [knownNames, knownEmails, knownPhones, name, email, phone, avatar] =
    form.watch([
      "knownNames",
      "knownEmails",
      "knownPhones",
      "name",
      "email",
      "phone",
      "avatar",
    ]);

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData?._id) {
          const customer = await customersApi.createCustomer(data);
          router.push(`/dashboard/customers/${customer._id}`);
        } else {
          await customersApi.updateCustomer(initialData._id, data);

          router.refresh();
        }
      };

      await toastPromise(fn(), {
        success: t("customers.toasts.changesSaved"),
        error: t("common.toasts.error"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const setKnownValues = (
    field: KnownFieldName,
    values: string[],
    validate = false,
  ) => {
    form.setValue(field, values, {
      shouldDirty: true,
      shouldValidate: validate,
    });
  };

  const disabled = loading || initialData?.isDeleted || !canSave;
  const canChangePhoto = !initialData?.isDeleted;
  const showIdentity = isEditing || Boolean(name || email);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-6 pb-4"
      >
        {showIdentity ? (
          <div className="flex min-w-0 items-center gap-3">
            <CustomerAvatar
              name={name}
              src={avatar}
              alt={t("customers.form.customerPhotoAlt")}
              className="size-12 text-sm"
            />
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold leading-tight">
                {name}
              </p>
              {email ? (
                <p className="truncate text-sm text-muted-foreground">
                  {email}
                </p>
              ) : null}
              {phone ? (
                <p className="truncate text-sm text-muted-foreground">
                  {phone}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <SectionCard title={t("customers.form.contactInformation")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithRequiredIndicator required>
                        {t("customers.form.name")}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <Input
                          disabled={disabled}
                          placeholder={t("customers.form.namePlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("customers.form.dateOfBirth")}</FormLabel>
                      <FormControl>
                        <DateTimeInput
                          disabled={disabled}
                          clearable
                          format="MM/dd/yyyy"
                          hideTime
                          {...field}
                          value={field.value ?? undefined}
                        />
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
                      <FormLabelWithRequiredIndicator required>
                        {t("customers.form.phone")}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <PhoneInput
                          label={t("customers.form.phone")}
                          disabled={disabled}
                          {...field}
                        />
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
                      <FormLabelWithRequiredIndicator required>
                        {t("customers.form.email")}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <Input
                          type="email"
                          disabled={disabled}
                          placeholder={t("customers.form.emailPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>
            <FormField
              control={form.control}
              name="requireDeposit"
              render={({ field }) => {
                const customDeposit = (field.value || "inherit") !== "inherit";

                return (
                  <SwitchCardFormItem
                    label={t("customers.form.customDeposit")}
                    description={t("customers.form.customDepositTooltip")}
                    checked={customDeposit}
                    disabled={disabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange("always");
                        form.setValue("depositPercentage", 50, {
                          shouldValidate: true,
                        });
                      } else {
                        field.onChange("inherit");
                        form.setValue("depositPercentage", undefined as any, {
                          shouldValidate: true,
                        });
                      }

                      void form.trigger("requireDeposit");
                    }}
                  >
                    {customDeposit && (
                      <>
                        <FormItem>
                          <FormControl>
                            <RadioButtonGroup
                              value={field.value}
                              disabled={disabled}
                              className="w-full"
                              joined
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value === "always") {
                                  const percentage =
                                    form.getValues("depositPercentage");
                                  if (percentage == null) {
                                    form.setValue("depositPercentage", 50, {
                                      shouldValidate: true,
                                    });
                                  }
                                } else {
                                  form.setValue(
                                    "depositPercentage",
                                    undefined as any,
                                    { shouldValidate: true },
                                  );
                                }

                                void form.trigger("requireDeposit");
                              }}
                            >
                              {depositOptions
                                .filter((value) => value !== "inherit")
                                .map((value) => (
                                  <RadioButtonGroupItem
                                    key={value}
                                    value={value}
                                    disabled={disabled}
                                    uncheckedVariant="outline"
                                    checkedVariant="default"
                                    className="h-auto whitespace-normal w-full"
                                  >
                                    {t(`customers.form.${value}`)}
                                  </RadioButtonGroupItem>
                                ))}
                            </RadioButtonGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        {field.value === "always" && (
                          <FormField
                            control={form.control}
                            name="depositPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabelWithRequiredIndicator required>
                                  {t("customers.form.depositAmount")}
                                </FormLabelWithRequiredIndicator>
                                <FormControl>
                                  <InputGroup className="w-full">
                                    <InputGroupInput>
                                      <Input
                                        disabled={disabled}
                                        placeholder="20"
                                        type="number"
                                        className={InputGroupInputClasses()}
                                        {...field}
                                        onChange={(event) => {
                                          field.onChange(event);
                                          void form.trigger("requireDeposit");
                                        }}
                                      />
                                    </InputGroupInput>
                                    <InputGroupAddon
                                      className={InputGroupAddonClasses()}
                                    >
                                      %
                                    </InputGroupAddon>
                                  </InputGroup>
                                </FormControl>
                                <FormDescription>
                                  {t("customers.form.depositAmountTooltip")}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </>
                    )}
                  </SwitchCardFormItem>
                );
              }}
            />
            <SectionCard
              title={t("customers.form.notes")}
              className="flex flex-1 flex-col"
              contentClassName="flex flex-1 flex-col"
            >
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="flex min-h-0 flex-1 flex-col">
                    <FormControl>
                      <Textarea
                        disabled={disabled}
                        className="min-h-24 flex-1 resize-none"
                        placeholder={t("customers.form.notesPlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("customers.form.notesPrivate")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <SectionCard title={t("customers.form.photo")}>
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <CustomerAvatar
                        name={name}
                        src={field.value}
                        alt={t("customers.form.customerPhotoAlt")}
                        className="size-14 text-base"
                      />
                      {canChangePhoto ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <AssetSelectorDialog
                            accept={["image/*"]}
                            onlyAssets
                            isOpen={avatarDialogOpen}
                            addTo={{
                              ...(initialData?._id
                                ? { customerId: initialData._id }
                                : {}),
                              description: name
                                ? `${name} - Customer Photo`
                                : t("customers.form.photo"),
                            }}
                            close={() => setAvatarDialogOpen(false)}
                            onSelected={(asset) =>
                              field.onChange(`/assets/${asset.filename}`)
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                            onClick={() => setAvatarDialogOpen(true)}
                          >
                            {t("customers.form.changePhoto")}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            disabled={disabled || !field.value}
                            onClick={() => {
                              field.onChange(null);
                              void form.trigger("avatar");
                            }}
                          >
                            {t("customers.form.remove")}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>
            <FormField
              control={form.control}
              name="dontAllowBookings"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border bg-card p-5 shadow-sm">
                  <div className="flex min-w-0 flex-col gap-1">
                    <FormLabel className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("customers.form.onlineBooking")}
                    </FormLabel>
                    <FormDescription>
                      {t("customers.form.onlineBookingDescription")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={!field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(!checked)}
                      // className="data-[state=checked]:bg-emerald-600"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {smsConsent}
            <SectionCard
              title={t("customers.form.alsoKnownAs")}
              description={t("customers.form.alsoKnownAsDescription")}
            >
              <div className="flex flex-col gap-4">
                <KnownValuesEditor
                  control={form.control}
                  name="knownNames"
                  label={t("customers.form.names")}
                  addLabel={t("customers.form.addName")}
                  removeLabel={t("customers.form.remove")}
                  placeholder={t("customers.form.namePlaceholder")}
                  kind="text"
                  disabled={disabled}
                  values={knownNames || []}
                  onChange={(values, validate) =>
                    setKnownValues("knownNames", values, validate)
                  }
                />
                <KnownValuesEditor
                  control={form.control}
                  name="knownEmails"
                  label={t("customers.form.emails")}
                  addLabel={t("customers.form.addEmail")}
                  removeLabel={t("customers.form.remove")}
                  placeholder={t("customers.form.emailPlaceholder")}
                  kind="email"
                  disabled={disabled}
                  values={knownEmails || []}
                  onChange={(values, validate) =>
                    setKnownValues("knownEmails", values, validate)
                  }
                />
                <KnownValuesEditor
                  control={form.control}
                  name="knownPhones"
                  label={t("customers.form.phones")}
                  addLabel={t("customers.form.addPhone")}
                  removeLabel={t("customers.form.remove")}
                  placeholder={t("customers.form.phone")}
                  kind="phone"
                  disabled={disabled}
                  values={knownPhones || []}
                  onChange={(values, validate) =>
                    setKnownValues("knownPhones", values, validate)
                  }
                />
              </div>
            </SectionCard>
          </div>
        </div>
        {canSave ? <SaveButton form={form} disabled={disabled} /> : null}
      </form>
    </Form>
  );
};
