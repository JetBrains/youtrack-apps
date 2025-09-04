import {useCallback, useRef} from 'react';

const REQUEST_DELAY = 150;
const CANCEL_PROMISE_REASON = 'cancelled';

export function useDebounce() {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const rejectRef = useRef<((reason?: unknown) => void) | null>(null);

    return useCallback(async <T>(call: () => Promise<T>): Promise<T> => {
        try {
            return await new Promise<T>((resolve, reject) => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    rejectRef.current?.(CANCEL_PROMISE_REASON);
                }

                rejectRef.current = reject;
                timeoutRef.current = setTimeout(() => {
                    resolve(call());
                }, REQUEST_DELAY);
            });
        } catch (reason) {
            if (reason !== CANCEL_PROMISE_REASON) {
                throw reason;
            }
            return await Promise.reject(reason);
        }
    }, []);
}
