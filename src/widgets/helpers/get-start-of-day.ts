export function getStartOfDay(timestamp: number): number {
    const date = new Date(timestamp);

    date.setUTCHours(0, 0, 0, 0);

    return date.getTime();
}
