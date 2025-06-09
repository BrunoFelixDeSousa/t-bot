// Formatação de valores monetários
export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

// Validação de valor monetário
export const isValidAmount = (amount: string | number): boolean => {
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numValue) && numValue > 0 && numValue <= 100000;
};
