import * as React from "react";

const ToastContext = React.createContext({ toasts: [], addToast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export const toast = {
  success: (msg: string) => alert(msg),
  error: (msg: string) => alert(msg),
};
