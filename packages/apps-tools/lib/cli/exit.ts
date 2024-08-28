export function exit(error: Error | unknown | null): boolean {
  if (error) {
    console.error(error.toString());
  }
  return process.exit(1);
}
