export const MAX_AMOUNT_PRESETS = 5;
export const DEFAULT_AMOUNT_PRESETS = [25, 50, 75, 100];

export function normalizeAmountPresets(
  value: number[] | null | undefined,
): number[] {
  const source = value?.length ? value : DEFAULT_AMOUNT_PRESETS;
  const seen = new Set<number>();
  const presets: number[] = [];

  for (const raw of source) {
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0 || seen.has(amount)) continue;
    seen.add(amount);
    presets.push(amount);
    if (presets.length >= MAX_AMOUNT_PRESETS) break;
  }

  return presets.length ? presets : [...DEFAULT_AMOUNT_PRESETS];
}

export function defaultPurchaseAmount(presets: number[]) {
  if (presets.includes(50)) return 50;
  return presets[0] ?? 50;
}

export function nextPresetAmount(presets: number[]) {
  const used = new Set(presets);
  let candidate = (presets[presets.length - 1] ?? 0) + 25;
  while (used.has(candidate)) candidate += 25;
  return candidate;
}

export function visibleAmountPresets(
  presets: number[],
  minAmount: number,
  maxAmount: number,
) {
  return presets.filter((preset) => preset >= minAmount && preset <= maxAmount);
}
