function parseCurrencyToFloat(currency: string): number {
  if (!currency) {
    throw new Error('Currency string is empty or null');
  }

  // Remove any spaces and non-numeric characters except for commas, periods, and minus signs
  let cleanedString = currency.trim().replace(/[\s]/g, '').replace(/[^\d.,-]/g, '');

  // Check for multiple commas or periods that might indicate an invalid format
  const commaCount = (cleanedString.match(/,/g) || []).length;
  const periodCount = (cleanedString.match(/\./g) || []).length;

  if (commaCount > 1 && periodCount > 1) {
    throw new Error('Invalid currency format with multiple decimal separators');
  }

  // Determine which separator is the decimal point based on the context
  if (cleanedString.includes(',') && cleanedString.includes('.')) {
    if (cleanedString.indexOf(',') < cleanedString.indexOf('.')) {
      cleanedString = cleanedString.replace(/,/g, '');
    } else {
      cleanedString = cleanedString.replace(/\./g, '').replace(/,/g, '.');
    }
  } else if (cleanedString.includes(',')) {
    cleanedString = cleanedString.replace(/,/g, '.');
  }

  // Convert the cleaned string to a float
  const parsedValue = parseFloat(cleanedString);

  // Check if the result is a valid number
  if (isNaN(parsedValue)) {
    throw new Error('Invalid currency format');
  }

  return parsedValue;
}