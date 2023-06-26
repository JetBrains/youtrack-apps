export function isSameDay(min: number, max: number): boolean {
    const begin = (new Date(min)).setUTCHours(0, 0, 0, 0);
    const end = (new Date(max)).setUTCHours(0, 0, 0, 0);

    return begin === end;
}
