// components/GlobalToaster.tsx
"use client";
import { Toaster } from "sonner";

export default function GlobalToaster() {
  return (
    <Toaster
      richColors
      position="top-right"
      closeButton
    />
  );
}
