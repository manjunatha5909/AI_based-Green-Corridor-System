import { useContext } from "react";
import { AccessibilityContext } from "./AccessibilityContextInstance";

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}

