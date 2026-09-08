// src/lib/currency.ts

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';

export interface FormatCurrencyOptions {
  showDecimals?: boolean;
  includeSign?: boolean;
}

export function formatCurrency(val: number, options?: FormatCurrencyOptions): string {
  const { showDecimals = true, includeSign = false } = options || {};
  const isNegative = val < 0;
  const absVal = Math.abs(val);

  const formattedNum = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  if (includeSign) {
    if (val > 0) return `+${CURRENCY_SYMBOL}${formattedNum}`;
    if (val < 0) return `-${CURRENCY_SYMBOL}${formattedNum}`;
    return `${CURRENCY_SYMBOL}${formattedNum}`;
  }

  return isNegative
    ? `-${CURRENCY_SYMBOL}${formattedNum}`
    : `${CURRENCY_SYMBOL}${formattedNum}`;
}

export function formatIndianNumber(val: number, decimals = 0): string {
  return Math.abs(val).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
