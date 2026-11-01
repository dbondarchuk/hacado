// Format time based on locale preference

export const formatTime = (
  time: string,
  uses12HourFormat = false,
  amLabel = "AM",
  pmLabel = "PM",
) => {
  if (!uses12HourFormat) return time; // Keep 24-hour format

  const [hourStr, minute] = time.split(":");
  const hour = Number.parseInt(hourStr, 10);

  // Note: This function is used in non-React contexts, so we can't use useI18n here
  // The AM/PM values should be passed from the calling component
  if (hour === 0) return `12:${minute.padStart(2, "0")} ${amLabel}`;
  if (hour < 12)
    return `${hour.toString().padStart(2, "0")}:${minute.padStart(2, "0")} ${amLabel}`;
  if (hour === 12) return `12:${minute.padStart(2, "0")} ${pmLabel}`;

  return `${(hour - 12).toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${pmLabel}`;
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

// Define week day map
export const getWeekDayMap = (
  monday = "Monday",
  tuesday = "Tuesday",
  wednesday = "Wednesday",
  thursday = "Thursday",
  friday = "Friday",
  saturday = "Saturday",
  sunday = "Sunday",
): Record<number, string> => ({
  1: monday,
  2: tuesday,
  3: wednesday,
  4: thursday,
  5: friday,
  6: saturday,
  7: sunday,
});

// Keep the old export for backward compatibility
export const weekDayMap: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

// Utility functions
export const generateTimeSlots = (
  startTime: { hour: number; minute: number },
  endTime: { hour: number; minute: number },
  interval: number,
): string[] => {
  const slots: string[] = [];
  let currentHour = startTime.hour;
  let currentMinute = startTime.minute;

  while (
    currentHour < endTime.hour ||
    (currentHour === endTime.hour && currentMinute <= endTime.minute)
  ) {
    const time = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
    slots.push(time);

    currentMinute += interval;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute %= 60;
    }
  }

  return slots;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};
