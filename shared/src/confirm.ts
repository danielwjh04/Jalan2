const CONFIRM_PATTERN = /\b(yes|ya|yup|ok|okay|confirm|confirmed|boleh)\b/i;
const NEGATION_PATTERN = /\b(no|not|cannot|can't|tak|tidak|x)\b[\s\S]{0,12}\b(yes|ok|okay|confirm|boleh)\b/i;

export function isConfirmationText(text: string): boolean {
  if (NEGATION_PATTERN.test(text)) return false;
  return CONFIRM_PATTERN.test(text);
}
