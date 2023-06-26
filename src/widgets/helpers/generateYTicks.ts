export function generateYTicks(maxY: number): number[] {
    const yTicks = [];
    for (let i = 0; i <= maxY; i++) {
        yTicks.push(i);
    }
    return yTicks;
}
