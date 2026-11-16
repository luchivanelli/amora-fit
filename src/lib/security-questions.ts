/** Preguntas para recuperar la contraseña sin mail. Se guarda la clave; la respuesta, hasheada. */
export const SECURITY_QUESTIONS = {
  "primera-mascota": "¿Cómo se llamaba tu primera mascota?",
  "ciudad-nacimiento-madre": "¿En qué ciudad nació tu mamá?",
  "mejor-amiga-infancia": "¿Cómo se llamaba tu mejor amiga o amigo de la infancia?",
  "primera-escuela": "¿Cómo se llamaba tu escuela primaria?",
  "comida-favorita-infancia": "¿Cuál era tu comida favorita de chica o chico?",
  "calle-infancia": "¿En qué calle vivías de chica o chico?",
} as const;

export type SecurityQuestionKey = keyof typeof SECURITY_QUESTIONS;

export const SECURITY_QUESTION_KEYS = Object.keys(SECURITY_QUESTIONS) as [SecurityQuestionKey, ...SecurityQuestionKey[]];

export function securityQuestionLabel(key: string | null | undefined) {
  return key && key in SECURITY_QUESTIONS ? SECURITY_QUESTIONS[key as SecurityQuestionKey] : null;
}

/** Así "Rosario", " rosario " y "ROSARIO" cuentan como la misma respuesta (también sin tildes). */
export function normalizeSecurityAnswer(answer: string) {
  return answer
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
