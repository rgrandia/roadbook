"use client";

import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useServiceWorkerRegistration } from "@/components/pwa-register";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useServiceWorkerRegistration();

  return (
    <TooltipProvider delayDuration={300}>
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </TooltipProvider>
  );
}
