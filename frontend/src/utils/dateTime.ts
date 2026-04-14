const pad = (value: number) => value.toString().padStart(2, '0');

export const formatDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const formatLocalDateTime = (date: Date = new Date()) =>
  `${formatDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;

export const formatDateAsStartOfDayLocalDateTime = (date: string) => `${date}T00:00:00`;
