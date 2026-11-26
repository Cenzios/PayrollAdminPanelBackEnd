import Decimal from 'decimal.js';

/**
 * Anything that can carry a money value: Prisma.Decimal (from DB rows / aggregates),
 * decimal.js Decimal, decimal strings, or legacy JSON numbers from request bodies.
 */
export type MoneyInput = { toString(): string } | string | number | null | undefined;

/** Converts any money input to a decimal.js Decimal. null/undefined become 0. */
export const toDecimal = (value: MoneyInput): Decimal => {
  if (value === null || value === undefined) {
    return new Decimal(0);
  }
  return new Decimal(value.toString());
};

/** Sums money values with exact decimal arithmetic. */
export const sumMoney = (values: MoneyInput[]): Decimal => {
  return values.reduce<Decimal>((acc, value) => acc.plus(toDecimal(value)), new Decimal(0));
};

/** Serializes a money value for API responses (always a JSON string, never a number). */
export const moneyToString = (value: MoneyInput): string => {
  return toDecimal(value).toString();
};

/** Human-readable money for emails: 2 decimals with thousands separators (e.g. 12,345.50). */
export const formatMoney = (value: MoneyInput): string => {
  const [integerPart, fractionPart] = toDecimal(value).toFixed(2).split('.');
  const withSeparators = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withSeparators}.${fractionPart}`;
};
