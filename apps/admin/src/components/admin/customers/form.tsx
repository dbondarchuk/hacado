"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  CustomerUpdateModel,
  DatabaseId,
  getCustomerSchemaWithUniqueCheck,
  isPaymentRequiredForCustomerTypes,
} from "@hacado/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  cn,
  DateTimeInput,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toastPromise,
  useDebounceCacheFn,
} from "@hacado/ui";
import { AssetSelectorDialog, SaveButton, useAuth } from "@hacado/ui-admin";
import { hasPermission } from "@hacado/utils";
import { PlusCircle, Trash } from "lucide-react";
// import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

export const CustomerForm: React.FC<{
  initialData?: CustomerUpdateModel &
    Partial<DatabaseId> & { isDeleted?: boolean };
}> = ({ initialData }) => {
  const t = useI18n("admin");
  const { user } = useAuth();
  const isEditing = Boolean(initialData?._id);
  const canSave = isEditing
    ? hasPermission(user, "customer", "update")
    : hasPermission(user, "customer", "create");

  const customerUniqueCheck = useDebounceCacheFn(
    adminApi.customers.checkCustomerUniqueEmailAndPhone,
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

  const [knownNames, knownEmails, knownPhones] = form.watch([
    "knownNames",
    "knownEmails",
    "knownPhones",
  ]);

  const name = form.watch("name");

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData?._id) {
          const _id = await adminApi.customers.createCustomer(data);
          router.push(`/dashboard/customers/${_id}`);
        } else {
          await adminApi.customers.updateCustomer(initialData._id, data);

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

  const onAddPhone = () => {
    form.setValue("knownPhones", [...knownPhones, ""]);
  };

  const onAddEmail = () => {
    form.setValue("knownEmails", [...knownEmails, ""]);
  };

  const onAddName = () => {
    form.setValue("knownNames", [...knownNames, ""]);
  };

  const onPhoneRemove = (index: number) => {
    const newValue = [...knownPhones];
    newValue.splice(index, 1);
    form.setValue("knownPhones", newValue);

    form.trigger("knownPhones");
  };

  const onEmailRemove = (index: number) => {
    const newValue = [...knownEmails];
    newValue.splice(index, 1);
    form.setValue("knownEmails", newValue);

    form.trigger("knownEmails");
  };

  const onNameRemove = (index: number) => {
    const newValue = [...knownNames];
    newValue.splice(index, 1);
    form.setValue("knownNames", newValue);

    form.trigger("knownNames");
  };

  const requireDeposit = form.watch("requireDeposit");
  const disabled = loading || initialData?.isDeleted || !canSave;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-6 pb-4"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <Card className="md:col-span-6 md:col-start-1 md:row-start-1">
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("customers.form.customerPhoto")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <div className="flex flex-col gap-4 items-center">
                    <img
                      src={field.value ?? "/unknown-person.png"}
                      alt={t("customers.form.customerPhotoAlt")}
                      height={120}
                      width={120}
                      className="h-28 w-28 rounded-full object-cover"
                    />
                    <div className="text-center">
                      <p className="text-2xl font-semibold">{name}</p>
                      <p className="text-base text-muted-foreground">
                        {form.watch("email")}
                      </p>
                    </div>
                    {initialData?._id && !initialData?.isDeleted && (
                      <div className="w-full flex gap-2">
                        <AssetSelectorDialog
                          accept={["image/*"]}
                          isOpen={avatarDialogOpen}
                          addTo={{
                            customerId: initialData._id,
                            description: `${name} - Customer Photo`,
                          }}
                          close={() => setAvatarDialogOpen(false)}
                          onSelected={(asset) =>
                            field.onChange(`/assets/${asset.filename}`)
                          }
                        />
                        <Button
                          type="button"
                          className="flex-1"
                          variant="secondary"
                          disabled={disabled}
                          onClick={() => setAvatarDialogOpen(true)}
                        >
                          {t("customers.form.changePhoto")}
                        </Button>
                        <Button
                          type="button"
                          className="flex-1"
                          variant="outline"
                          disabled={disabled || !field.value}
                          onClick={() => {
                            field.onChange(null);
                            form.trigger("avatar");
                          }}
                        >
                          {t("customers.form.remove")}
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-6 md:col-start-7 md:row-start-1 md:row-span-2">
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("customers.form.personalInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("customers.form.name")}</FormLabel>
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
                    <FormLabel>{t("customers.form.phone")}</FormLabel>
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
                    <FormLabel>{t("customers.form.email")}</FormLabel>
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
              <FormField
                control={form.control}
                name="dontAllowBookings"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-row items-center gap-2">
                      <Checkbox
                        id="dontAllowBookings"
                        disabled={disabled}
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                      <FormLabel
                        htmlFor="dontAllowBookings"
                        className="cursor-pointer"
                      >
                        {t("customers.form.dontAllowAppointments")}{" "}
                        <InfoTooltip>
                          {t("customers.form.dontAllowAppointmentsTooltip")}
                        </InfoTooltip>
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requireDeposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("customers.form.requireDeposit")}{" "}
                      <InfoTooltip>
                        {t("customers.form.requireDepositTooltip")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Select
                        disabled={disabled}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          field.onBlur();
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("customers.form.selectOption")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {isPaymentRequiredForCustomerTypes.map((value) => (
                            <SelectItem key={value} value={value}>
                              {t(`customers.form.${value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {requireDeposit === "always" && (
                <FormField
                  control={form.control}
                  name="depositPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("customers.form.depositAmount")}{" "}
                        <InfoTooltip>
                          <p>{t("customers.form.depositAmountTooltip")}</p>
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput>
                            <Input
                              disabled={disabled}
                              placeholder="20"
                              type="number"
                              className={InputGroupInputClasses()}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                form.trigger("requireDeposit");
                              }}
                            />
                          </InputGroupInput>
                          <InputGroupAddon className={InputGroupAddonClasses()}>
                            %
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-6 md:col-start-1 md:row-start-2">
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("customers.form.notes")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-4">
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        autoResize
                        disabled={disabled}
                        className="min-h-20"
                        placeholder={t("customers.form.notesPlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 justify-between">
                <div>
                  {t("customers.form.knownNames")}{" "}
                  <InfoTooltip>
                    {t("customers.form.knownNamesTooltip")}
                  </InfoTooltip>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAddName}
                  title={t("customers.form.addName")}
                  disabled={disabled}
                >
                  <PlusCircle />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-4">
              {(knownNames || []).map((name, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`knownNames.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputGroup>
                          <Input
                            disabled={disabled}
                            placeholder={t("customers.form.namePlaceholder")}
                            className={cn(InputGroupInputClasses(), "flex-1")}
                            {...field}
                          />
                          <InputGroupAddon>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              disabled={disabled}
                              className={cn(InputGroupAddonClasses(), "px-2")}
                              onClick={() => onNameRemove(index)}
                            >
                              <Trash />
                            </Button>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 justify-between">
                <div>
                  {t("customers.form.knownEmails")}{" "}
                  <InfoTooltip>
                    {t("customers.form.knownEmailsTooltip")}
                  </InfoTooltip>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAddEmail}
                  title={t("customers.form.addEmail")}
                  disabled={disabled}
                >
                  <PlusCircle />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-4">
              {(knownEmails || []).map((email, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`knownEmails.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputGroup>
                          <Input
                            type="email"
                            disabled={disabled}
                            placeholder={t("customers.form.emailPlaceholder")}
                            className={cn(InputGroupInputClasses(), "flex-1")}
                            {...field}
                          />
                          <InputGroupAddon>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              disabled={disabled}
                              className={cn(InputGroupAddonClasses(), "px-2")}
                              onClick={() => onEmailRemove(index)}
                            >
                              <Trash />
                            </Button>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 justify-between">
                <div>
                  {t("customers.form.knownPhones")}{" "}
                  <InfoTooltip>
                    {t("customers.form.knownPhonesTooltip")}
                  </InfoTooltip>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAddPhone}
                  title={t("customers.form.addPhone")}
                  disabled={disabled}
                >
                  <PlusCircle />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-4">
              {(knownPhones || []).map((phone, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`knownPhones.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputGroup>
                          <PhoneInput
                            label={t("customers.form.phone")}
                            disabled={loading}
                            className={cn(
                              "flex-1 focus:ring-0 focus:ring-offset-0 focus-within:ring-0 focus-within:ring-offset-0",
                            )}
                            inputClassName={InputGroupInputClasses()}
                            {...field}
                          />
                          <InputGroupAddon>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className={cn(InputGroupAddonClasses(), "px-2")}
                              onClick={() => onPhoneRemove(index)}
                            >
                              <Trash />
                            </Button>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {canSave ? <SaveButton form={form} disabled={disabled} /> : null}
      </form>
    </Form>
  );
};
