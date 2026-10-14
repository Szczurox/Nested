/** True when `error` looks like a Prisma error with the given code (e.g. "P2002", "P2025"). */
export function isPrismaError(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
