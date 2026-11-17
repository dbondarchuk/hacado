const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\u001bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

const GSM_EXTENDED = "^{}\\[~]|€";

const gsmSeptets = (body: string): number | null => {
  let septets = 0;
  for (const char of body) {
    if (GSM_BASIC.includes(char)) {
      septets += 1;
      continue;
    }

    if (GSM_EXTENDED.includes(char)) {
      septets += 2;
      continue;
    }

    return null;
  }

  return septets;
};

/** True when every character fits GSM-7 (basic + extended). */
export const isGsmSmsCharset = (body: string): boolean =>
  body.length === 0 || gsmSeptets(body) !== null;

export const countSmsSegments = (body: string): number => {
  if (!body) {
    return 0;
  }

  const septets = gsmSeptets(body);
  if (septets !== null) {
    if (septets <= 160) {
      return 1;
    }

    return Math.ceil(septets / 153);
  }

  const length = [...body].length;
  if (length <= 70) {
    return 1;
  }

  return Math.ceil(length / 67);
};
