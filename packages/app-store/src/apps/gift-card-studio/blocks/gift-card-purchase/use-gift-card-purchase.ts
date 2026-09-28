"use client";

import { useI18n } from "@hacado/i18n/client";
import { CollectPayment, IdName } from "@hacado/types";
import {
  toast,
  useCurrencyFormat,
  useCurrencySymbol,
  useDebounce,
} from "@hacado/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Gift } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PaymentAppForms } from "../../../../payment-forms";
import { DEFAULT_MAX_AMOUNT, DEFAULT_MIN_AMOUNT } from "../../const";
import {
  GetAmountLimitsResponse,
  giftCardPuchaseFormSchema,
  GiftCardPurchaseFormPayload,
} from "../../models/public";
import {
  GiftCardStudioPublicKeys,
  GiftCardStudioPublicNamespace,
  giftCardStudioPublicNamespace,
} from "../../translations/types";
import {
  createOrUpdateIntent,
  fetchPreview,
  getInitOptions,
  purchaseGiftCard,
} from "./actions";

const STEPS = ["details", "payment"] as const;

export function useGiftCardPurchase({
  appId,
  isEditor,
  defaultAmount = 50,
}: {
  appId: string | null | undefined;
  isEditor?: boolean;
  defaultAmount?: number;
}) {
  const t = useI18n<GiftCardStudioPublicNamespace, GiftCardStudioPublicKeys>(
    giftCardStudioPublicNamespace,
  );
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const currencySymbol = useCurrencySymbol();

  const [currentStep, setCurrentStep] =
    useState<(typeof STEPS)[number]>("details");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [payment, setPayment] = useState<CollectPayment | null>(null);
  const [amountLimits, setAmountLimits] =
    useState<GetAmountLimitsResponse | null>(null);
  const [designs, setDesigns] = useState<IdName[]>([]);

  const PaymentForm = useMemo(
    () =>
      payment?.intent?.appName ? PaymentAppForms[payment.intent.appName] : null,
    [payment],
  );

  const formSchema = useMemo(() => {
    return giftCardPuchaseFormSchema.superRefine((data, ctx) => {
      if (data.amount < (amountLimits?.minAmount ?? DEFAULT_MIN_AMOUNT)) {
        ctx.addIssue({
          path: ["amount"],
          code: z.ZodIssueCode.custom,
          message: t("validation.purchase.amount.min", {
            min: amountLimits?.minAmount ?? DEFAULT_MIN_AMOUNT,
          }),
        });
      }
      if (data.amount > (amountLimits?.maxAmount ?? DEFAULT_MAX_AMOUNT)) {
        ctx.addIssue({
          path: ["amount"],
          code: z.ZodIssueCode.custom,
          message: t("validation.purchase.amount.max", {
            max: amountLimits?.maxAmount ?? DEFAULT_MAX_AMOUNT,
          }),
        });
      }
    });
  }, [amountLimits, t]);

  const form = useForm<GiftCardPurchaseFormPayload>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      designId: "",
      amount: defaultAmount,
      name: "",
      email: "",
      sendToSomeoneElse: false,
    },
    mode: "all",
    reValidateMode: "onChange",
  });

  const formRef = useRef(form);
  formRef.current = form;

  const amount = form.watch("amount");
  const designId = form.watch("designId");
  const fromName = form.watch("name");
  const toName = form.watch("toName");
  const message = form.watch("message");
  const sendToSomeoneElse = form.watch("sendToSomeoneElse");
  const isValid = form.formState.isValid;

  useEffect(() => {
    const fetchAmountLimits = async () => {
      if (!appId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await getInitOptions(appId);
        setAmountLimits(res.amountLimits);
        setDesigns(res.designs);

        if (res.designs.length === 1) {
          formRef.current.setValue("designId", res.designs[0]._id);
        }
      } catch (e: any) {
        console.error(e);
        setDesigns([]);
        setAmountLimits({
          minAmount: DEFAULT_MIN_AMOUNT,
          maxAmount: DEFAULT_MAX_AMOUNT,
        } satisfies GetAmountLimitsResponse);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAmountLimits();
  }, [appId]);

  const debouncedPreviewPayload = useDebounce(
    { designId, amount, fromName, toName, message },
    1000,
  );

  useEffect(() => {
    const fetchPreviewFn = async () => {
      if (
        !appId ||
        !debouncedPreviewPayload.amount ||
        !debouncedPreviewPayload.designId
      ) {
        setPreviewUrl(null);
        setPreviewLoading(false);
        return;
      }

      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const res = await fetchPreview(appId, debouncedPreviewPayload);

        if (res.success) {
          setPreviewUrl(res.imageDataUrl);
        } else {
          setPreviewUrl(null);
          setPreviewError(res.code);
        }
      } catch (e: any) {
        console.error(e);
        setPreviewUrl(null);
        setPreviewError(e.toString());
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchPreviewFn();
  }, [
    appId,
    debouncedPreviewPayload.amount,
    debouncedPreviewPayload.designId,
    debouncedPreviewPayload.fromName,
    debouncedPreviewPayload.toName,
    debouncedPreviewPayload.message,
  ]);

  const stepIndex = STEPS.indexOf(currentStep);
  const steps = [
    { id: "details", label: t("block.steps.details"), icon: Gift },
    { id: "payment", label: t("block.steps.payment"), icon: CreditCard },
  ];

  const handleGoToPayment = async () => {
    const email = form.getValues("email");
    const phone = form.getValues("phone");
    if (
      !appId ||
      isEditor ||
      !amount ||
      !designId ||
      !fromName ||
      !email ||
      !phone
    )
      return;

    try {
      setIsLoading(true);
      const res = await createOrUpdateIntent(appId, {
        amount,
        name: fromName,
        email,
        phone,
        intentId: payment?.intent?._id,
      });

      if (res) {
        setPayment(res);
        setCurrentStep("payment");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(t("block.errors.createOrUpdateIntentFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const formValues = form.getValues();
    if (
      !appId ||
      isEditor ||
      !formValues.amount ||
      !formValues.designId ||
      !formValues.name ||
      !formValues.email ||
      !formValues.phone ||
      !payment?.intent?._id
    )
      return;

    try {
      setIsLoading(true);
      const res = await purchaseGiftCard(appId, {
        amount: formValues.amount,
        designId: formValues.designId,
        name: formValues.name,
        email: formValues.email,
        phone: formValues.phone,
        intentId: payment?.intent?._id,
        sendToSomeoneElse: formValues.sendToSomeoneElse,
        toName: formValues.sendToSomeoneElse
          ? formValues.toName
          : formValues.name,
        toEmail: formValues.sendToSomeoneElse
          ? formValues.toEmail
          : formValues.email,
        message: formValues.message,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        toast.error(t("block.errors.purchaseFailed"));
      }
    } catch (e: any) {
      console.error(e);
      toast.error(t("block.errors.purchaseFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPurchase = () => {
    setIsSuccess(false);
    form.reset();
    if (designs.length === 1) {
      form.setValue("designId", designs[0]._id);
    }

    setPreviewUrl(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setIsLoading(false);
    setPayment(null);
    setCurrentStep("details");
  };

  return {
    t,
    i18n,
    currencyFormat,
    currencySymbol,
    form,
    currentStep,
    setCurrentStep,
    previewUrl,
    previewLoading,
    previewError,
    isLoading,
    isSuccess,
    payment,
    PaymentForm,
    amountLimits,
    designs,
    amount,
    designId,
    sendToSomeoneElse,
    isValid,
    stepIndex,
    steps,
    handleGoToPayment,
    handleSubmit,
    handleNewPurchase,
    appId,
  };
}

export type GiftCardPurchaseState = ReturnType<typeof useGiftCardPurchase>;
