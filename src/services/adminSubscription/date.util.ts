export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const expectedMonth = (result.getMonth() + months) % 12;
  result.setMonth(result.getMonth() + months);
  // Handle month length overflows (e.g. Jan 31 + 1 month -> Feb 28/29)
  if (result.getMonth() !== expectedMonth && result.getMonth() !== (expectedMonth + 12) % 12) {
    result.setDate(0);
  }
  return result;
}
