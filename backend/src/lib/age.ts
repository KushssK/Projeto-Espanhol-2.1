/**
 * Verificação EXATA de idade mínima.
 *
 * Uma pessoa só tem `requiredAge` anos completos a partir do dia do aniversário.
 * Ex.: quem faz 13 anos amanhã NÃO pode se cadastrar hoje; quem fez ontem, pode.
 * O cálculo usa o dia do mês (não apenas a diferença de anos).
 */
export function hasCompletedAge(dob: Date, requiredAge: number): boolean {
  if (Number.isNaN(dob.getTime())) return false;

  const now = new Date();
  const birthday = new Date(
    dob.getFullYear() + requiredAge,
    dob.getMonth(),
    dob.getDate(),
    0, 0, 0, 0
  );

  return now.getTime() >= birthday.getTime();
}