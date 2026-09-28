"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Registers the offline service worker - production only, since registering
 * in dev would fight Turbopack's HMR with a stale cache. Call once, globally
 * (mounted in app-providers.tsx), independent of the install button below.
 */
export function useServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => console.error("SW registration failed", error));
  }, []);
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * "Instal·la l'app" button, shown only once the browser has actually offered
 * an install prompt (Chrome/Edge/Android via beforeinstallprompt - other
 * browsers never fire it, so the button just never appears there).
 */
export function PwaInstallButton({ className }: { className?: string }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (!installEvent) return null;

  return (
    <Button
      variant="ghost"
      className={className}
      onClick={async () => {
        await installEvent.prompt();
        const { outcome } = await installEvent.userChoice;
        if (outcome === "accepted") setInstallEvent(null);
      }}
    >
      <Download className="h-4 w-4" />
      Instal·la l&apos;app
    </Button>
  );
}
