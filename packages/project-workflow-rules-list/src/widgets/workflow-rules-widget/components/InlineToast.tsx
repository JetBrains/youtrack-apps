import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ToastContextValue {
  show: (message: string, anchorElement: HTMLElement, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => undefined,
});

const DEFAULT_DURATION = 800;

interface ToastMessage {
  id: number;
  message: string;
  top: number;
  left: number;
}

const ToastProviderComponent: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const element = document.createElement("div");
    element.className = "toast-inline-root";
    document.body.appendChild(element);
    containerRef.current = element;

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      if (containerRef.current) {
        document.body.removeChild(containerRef.current);
      }
      containerRef.current = null;
      timerRef.current = null;
    };
  }, []);

  const show = (message: string, anchorElement: HTMLElement, duration = DEFAULT_DURATION) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const rect = anchorElement.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const left = rect.left + window.scrollX;
    const id = Date.now();

    setToast({id, message, top, left});

    timerRef.current = window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
      timerRef.current = null;
    }, duration);
  };

  return (
    <ToastContext.Provider value={{show}}>
      {children}
      {containerRef.current && toast
        ? createPortal(
          <div key={toast.id} className="toast-inline" style={{ top: `${toast.top}px`, left: `${toast.left}px` }}>
            <span className="toast-inline__message">{toast.message}</span>
          </div>,
          containerRef.current,
        )
        : null}
    </ToastContext.Provider>
  );
};

export const ToastProvider = React.memo(ToastProviderComponent);

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);


