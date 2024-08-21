export function exit(message: (Error & {statusCode?: number}) | null): boolean {
  if (message instanceof Error) {
    console.error(message.toString());
  }
  return process.exit(1);
}
