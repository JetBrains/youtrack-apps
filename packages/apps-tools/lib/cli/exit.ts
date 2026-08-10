export const ExitCode = {
  General: 1,
  Usage: 2,
  Authentication: 3,
  NotFound: 4,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

export function exit(error: Error | unknown | null, code?: number): boolean {
  if (error) {
    console.error(error.toString());
  }
  return process.exit(code ?? classifyError(error));
}

function classifyError(error: unknown): ExitCode {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (/\[(401|403)\]|\b(unauthorized|forbidden)\b|token is required/i.test(message)) {
    return ExitCode.Authentication;
  }

  if (/\[404\]|\bnot found\b/i.test(message)) {
    return ExitCode.NotFound;
  }

  if (/\[4\d\d\]|\b(option|argument|command syntax|validation)\b|unknown option|should be defined|is required|provide an|ambiguous|invalid JSON/i.test(message)) {
    return ExitCode.Usage;
  }

  return ExitCode.General;
}
