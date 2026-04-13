import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(1);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ type = "info", title, message }) => {
      const id = nextIdRef.current++;

      setToasts((current) => [...current, { id, type, title, message }]);

      window.setTimeout(() => {
        dismissToast(id);
      }, 3600);
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      success(message, title = "Succes") {
        pushToast({ type: "success", title, message });
      },
      error(message, title = "Erreur") {
        pushToast({ type: "error", title, message });
      },
      info(message, title = "Information") {
        pushToast({ type: "info", title, message });
      },
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <div className="toast-copy">
              <strong>{toast.title}</strong>
              <p>{toast.message}</p>
            </div>

            <button
              type="button"
              className="toast-close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Fermer la notification"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
