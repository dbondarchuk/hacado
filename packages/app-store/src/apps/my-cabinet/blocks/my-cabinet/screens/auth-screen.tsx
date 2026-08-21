"use client";

import { useI18n } from "@hacado/i18n/client";
import { CustomerOtpForm } from "@hacado/ui";
import { useCallback } from "react";
import {
  MyCabinetPublicKeys,
  MyCabinetPublicNamespace,
  myCabinetPublicNamespace,
} from "../../../translations/types";
import {
  getAuthOptionsAction,
  requestOtpAction,
  verifyOtpAction,
} from "../actions";
import type { CustomerProfile } from "../types";

type AuthScreenProps = {
  appId?: string;
  onAuthenticated: (profile: CustomerProfile) => void;
};

export const AuthScreen = ({ onAuthenticated }: AuthScreenProps) => {
  const t = useI18n<MyCabinetPublicNamespace, MyCabinetPublicKeys>(
    myCabinetPublicNamespace,
  );

  const getAuthOptions = useCallback(() => getAuthOptionsAction(), []);

  return (
    <CustomerOtpForm
      getAuthOptions={getAuthOptions}
      requestOtp={({ channel, email, phone }) =>
        requestOtpAction(channel === "phone" ? { phone } : { email })
      }
      verifyOtp={({ channel, email, phone, otp }) =>
        verifyOtpAction(channel === "phone" ? { phone, otp } : { email, otp })
      }
      onVerified={(result) =>
        onAuthenticated({
          name: result.name,
          email: result.email,
          phone: result.phone,
        })
      }
      labels={{
        descriptionEmailOnly: t("block.auth.descriptionEmailOnly"),
        descriptionPhoneOnly: t("block.auth.descriptionPhoneOnly"),
        descriptionEmailOrPhone: t("block.auth.descriptionEmailOrPhone"),
        email: t("block.auth.type.email"),
        phone: t("block.auth.type.phone"),
        emailPlaceholder: t("block.auth.emailPlaceholder"),
        phonePlaceholder: t("block.auth.phonePlaceholder"),
        emailInvalid: t("block.auth.emailInvalid"),
        phoneInvalid: t("block.auth.phoneInvalid"),
        request: t("block.auth.requestOtp"),
        requestBlocked: (values) => t("block.auth.requestOtpBlocked", values),
        hint: t("block.auth.otpHint"),
        verify: t("block.auth.verifyOtp"),
        sent: t("block.auth.otpSent"),
        invalid: t("block.auth.otpInvalid"),
        requestError: t("block.auth.requestOtpError"),
        verifyError: t("block.auth.verifyOtpError"),
      }}
    />
  );
};
