export type PromoStartShortcut = "now" | "next-noon" | "next-midnight" | "after-1h";
export type PromoEndShortcut = "10m" | "6h" | "24h" | "3d" | "1w" | "1mo";

const pad = (value: number) => String(value).padStart(2, "0");

export const toDateTimeLocalValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
  `T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const atMinutePrecision = (date: Date) => {
  const result = new Date(date);
  result.setSeconds(0, 0);
  return result;
};

export const getPromoStartTime = (shortcut: PromoStartShortcut, now = new Date()) => {
  const result = atMinutePrecision(now);

  if (shortcut === "now") return result;

  if (shortcut === "after-1h") {
    result.setHours(result.getHours() + 1);
    return result;
  }

  if (shortcut === "next-midnight") {
    result.setDate(result.getDate() + 1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  result.setHours(12, 0, 0, 0);
  if (result.getTime() <= now.getTime()) result.setDate(result.getDate() + 1);
  return result;
};

const addCalendarMonths = (date: Date, months: number) => {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(originalDay, lastDay));
  return result;
};

export const getPromoEndTime = (startValue: string, shortcut: PromoEndShortcut) => {
  const start = new Date(startValue);
  if (!startValue || Number.isNaN(start.getTime())) return null;

  if (shortcut === "1mo") return addCalendarMonths(start, 1);

  const result = new Date(start);
  if (shortcut === "10m") result.setMinutes(result.getMinutes() + 10);
  if (shortcut === "6h") result.setHours(result.getHours() + 6);
  if (shortcut === "24h") result.setHours(result.getHours() + 24);
  if (shortcut === "3d") result.setDate(result.getDate() + 3);
  if (shortcut === "1w") result.setDate(result.getDate() + 7);
  return result;
};

const durationPart = (value: number, unit: string) =>
  `${value} ${unit}${value === 1 ? "" : "s"}`;

const formatDurationMinutes = (totalMinutes: number) => {
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days) {
    return [durationPart(days, "day"), hours ? durationPart(hours, "hour") : null]
      .filter(Boolean)
      .join(" ");
  }
  if (hours) {
    return [durationPart(hours, "hour"), minutes ? durationPart(minutes, "minute") : null]
      .filter(Boolean)
      .join(" ");
  }
  return durationPart(minutes, "minute");
};

export const formatPromoDuration = (startValue: string, endValue: string) => {
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  return formatDurationMinutes(Math.max(1, Math.round((end - start) / 60_000)));
};

export const isPromoExpired = (endValue: string, now = Date.now()) => {
  const end = new Date(endValue).getTime();
  return Number.isFinite(end) && end <= now;
};

export const formatPromoCountdown = (
  startValue: string,
  endValue: string,
  now = Date.now(),
) => {
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start ||
    end <= now
  ) {
    return null;
  }

  const isScheduled = now < start;
  const target = isScheduled ? start : end;
  const minutes = Math.max(1, Math.ceil((target - now) / 60_000));
  return `${formatDurationMinutes(minutes)} ${isScheduled ? "until start" : "left"}`;
};
