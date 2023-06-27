import { format } from 'date-fns';

export function formatDate(timestamp: number | Date, pattern: string): string {
    return format(timestamp, pattern);
}
