

export function addDays(fromDate: Date, numDays: number): Date {
  const newDate = new Date();
  newDate.setDate(fromDate.getDate() + numDays);

  return newDate;
}

export function subtractDates(firstDate: Date, secondDate: Date): number {
  const millisecondsDiff = secondDate.getTime() - firstDate.getTime()

  return Math.round(millisecondsDiff / (24 * 60 * 60 * 60));
}