export function getEndOfDay(timestamp: number): number {
    const date = new Date(timestamp);

    date.setUTCHours(23, 59, 59, 999);

    return date.getTime();
}
