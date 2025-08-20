import {useCallback, useEffect, useRef} from 'react';

export interface Props {
    tickPeriod: number;
    onTick: () => void;
}

export default function useRefreshTimer({tickPeriod, onTick}: Props) {
    const onTickRef = useRef(onTick);
    const handlerRef = useRef<number | null>(null);

    useEffect(() => {
        onTickRef.current = onTick;
    }, [onTick]);

    const cancel = useCallback(() => {
        if (handlerRef.current != null) {
            clearTimeout(handlerRef.current);
            handlerRef.current = null;
        }
    }, []);

    const schedule = useCallback(
        function scheduleInner() {
            if (typeof window === 'undefined') {
                handlerRef.current = null;
                return;
            }

            handlerRef.current = window.setTimeout(() => {
                if (typeof document === 'undefined' || !document.hidden) {
                    onTickRef.current();
                }

                scheduleInner();
            }, tickPeriod);
        },
        [tickPeriod],
    );

    useEffect(() => {
        schedule();
        return () => {
            cancel();
        };
    }, [schedule, cancel]);

    return {cancel, schedule};
}
