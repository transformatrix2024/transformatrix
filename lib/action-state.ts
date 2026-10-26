import { z } from "zod";

// What every admin form action returns to its form.
export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
} | null;

export function invalid(error: z.ZodError): ActionState {
  return {
    ok: false,
    message: "Please fix the highlighted fields.",
    errors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}

export function fail(message: string, errors?: Record<string, string[]>): ActionState {
  return { ok: false, message, errors };
}

// Postgres unique-constraint violation, optionally for one constraint.
// Drizzle wraps driver errors, so look at the cause too.
export function isUniqueViolation(err: unknown, constraint?: string) {
  const e = err as { code?: string; constraint_name?: string; cause?: unknown };
  const pg = (e?.code ? e : e?.cause) as { code?: string; constraint_name?: string } | undefined;
  return pg?.code === "23505" && (!constraint || pg.constraint_name === constraint);
}

export function isForeignKeyViolation(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return (e?.code ?? e?.cause?.code) === "23503";
}

// FormData helpers: trimmed strings, with empty → null where a column is optional.
export function text(fd: FormData, name: string) {
  const value = fd.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalText(fd: FormData, name: string) {
  return text(fd, name) || null;
}
