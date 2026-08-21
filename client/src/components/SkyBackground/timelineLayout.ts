const DAY_MS = 86_400_000;

export const BASE_CAMERA_Z = 10;
export const MAX_CAMERA_Z = 50;

export const startOfWeek = (value: string | Date): Date => {
  const source = new Date(value);
  const date = new Date(source.getFullYear(), source.getMonth(), source.getDate());
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
};

const utcDayNumber = (value: Date): number =>
  Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / DAY_MS;

export const dateToWeekPosition = (
  value: string | Date,
  origin = startOfWeek(new Date()),
): number => {
  const date = new Date(value);
  const dayPosition = utcDayNumber(date) - utcDayNumber(origin);
  return dayPosition / 7;
};

export const dateToWeekIndex = (
  value: string | Date,
  origin = startOfWeek(new Date()),
): number => Math.floor(dateToWeekPosition(value, origin));

export const weekPositionToDate = (
  position: number,
  origin = startOfWeek(new Date()),
): Date => {
  const date = new Date(origin);
  date.setDate(date.getDate() + position * 7);
  return date;
};

export const getWeekWorldWidth = (aspect: number): number =>
  2 * Math.tan(Math.PI / 6) * BASE_CAMERA_Z * aspect;

export const formatWeekRange = (weekStart: Date): string => {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const startLabel = weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: weekStart.getMonth() === end.getMonth() ? undefined : "short",
    day: "numeric",
  });
  return `${startLabel}–${endLabel}`;
};
