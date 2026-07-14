const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
};

export function formatBookingDate(value: string, locale?: string | string[]): string {
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(locale, DATE_OPTIONS);
}
