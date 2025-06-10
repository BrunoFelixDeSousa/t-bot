/**
 * Formata valores monetários para o padrão brasileiro (R$)
 * @param value - Valor a ser formatado (string ou number)
 * @returns String formatada no padrão monetário brasileiro
 */
export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

/**
 * Valida se um valor monetário está dentro dos parâmetros aceitáveis
 * @param amount - Valor a ser validado (string ou number)
 * @returns true se o valor é válido, false caso contrário
 */
export const isValidAmount = (amount: string | number): boolean => {
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numValue) && numValue > 0 && numValue <= 100000;
};
