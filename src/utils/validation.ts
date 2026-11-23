import { ValidationError } from "../errors/AppError.js";

type Body = Record<string, unknown>;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function assertUuid(value: unknown, label: string): string {
  if (!isUuid(value)) {
    throw new ValidationError(`${label} inválido: informe um UUID válido.`);
  }

  return value;
}

export function asObject(body: unknown): Body {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError(
      "O corpo da requisição deve ser um objeto JSON.",
    );
  }

  return body as Body;
}

export function requiredString(
  body: Body,
  field: string,
  label: string,
  maxLength = 255,
): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${label} é obrigatório.`);
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      `${label} deve ter no máximo ${maxLength} caracteres.`,
    );
  }

  return trimmed;
}

export function optionalString(
  body: Body,
  field: string,
  label: string,
  maxLength = 1000,
): string | null {
  const value = body[field];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ValidationError(`${label} deve ser um texto.`);
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(
      `${label} deve ter no máximo ${maxLength} caracteres.`,
    );
  }

  return trimmed;
}

export function optionalPositiveInt(
  body: Body,
  field: string,
  label: string,
): number | null {
  const value = body[field];

  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new ValidationError(`${label} deve ser um inteiro maior que zero.`);
  }

  return value as number;
}

export function optionalNonNegativeInt(
  body: Body,
  field: string,
  label: string,
  defaultValue: number,
): number {
  const value = body[field];

  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new ValidationError(
      `${label} deve ser um inteiro maior ou igual a zero.`,
    );
  }

  return value as number;
}

export function requiredIntInRange(
  body: Body,
  field: string,
  label: string,
  min: number,
  max: number,
): number {
  const value = body[field];

  if (
    !Number.isInteger(value) ||
    (value as number) < min ||
    (value as number) > max
  ) {
    throw new ValidationError(
      `${label} deve ser um número inteiro de ${min} a ${max}.`,
    );
  }

  return value as number;
}

export function optionalBoolean(
  body: Body,
  field: string,
  label: string,
  defaultValue: boolean,
): boolean {
  const value = body[field];

  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== "boolean") {
    throw new ValidationError(`${label} deve ser verdadeiro ou falso.`);
  }

  return value;
}

export function requiredUuid(body: Body, field: string, label: string): string {
  const value = body[field];

  if (value === undefined || value === null || value === "") {
    throw new ValidationError(`${label} é obrigatório.`);
  }

  return assertUuid(value, label);
}
