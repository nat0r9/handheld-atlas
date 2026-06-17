"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type ConsentValue = "granted" | "denied";

interface AnalyticsConsentProps {
  measurementId: string;
}

const STORAGE_KEY = "handheldatlas-analytics-consent-v1";
const SCRIPT_ID = "handheldatlas-google-analytics";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    __handheldAtlasGaReady?: boolean;
    __handheldAtlasGaConfigured?: boolean;
  }
}

function ensureGtag(): void {
  window.dataLayer = window.dataLayer ?? [];

  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
}

function setConsent(value: ConsentValue): void {
  ensureGtag();

  window.gtag("consent", "update", {
    analytics_storage: value,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

function configureGoogleAnalytics(measurementId: string): void {
  ensureGtag();

  if (window.__handheldAtlasGaConfigured) {
    return;
  }

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false,
    cookie_flags: "SameSite=None;Secure",
  });

  window.__handheldAtlasGaConfigured = true;
}

function loadGoogleAnalytics(
  measurementId: string,
  onReady: () => void,
): void {
  ensureGtag();
  configureGoogleAnalytics(measurementId);

  if (window.__handheldAtlasGaReady) {
    onReady();
    return;
  }

  const existingScript = document.getElementById(
    SCRIPT_ID,
  ) as HTMLScriptElement | null;

  if (existingScript) {
    existingScript.addEventListener(
      "load",
      () => {
        window.__handheldAtlasGaReady = true;
        window.setTimeout(onReady, 0);
      },
      { once: true },
    );
    return;
  }

  const script = document.createElement("script");

  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    measurementId,
  )}`;

  script.onload = () => {
    window.__handheldAtlasGaReady = true;
    window.setTimeout(onReady, 0);
  };

  script.onerror = () => {
    console.error(
      "HandheldAtlas: Google Analytics script failed to load.",
    );
  };

  document.head.appendChild(script);
}

function sendPageView(measurementId: string): void {
  if (
    !window.__handheldAtlasGaReady ||
    !window.__handheldAtlasGaConfigured
  ) {
    return;
  }

  window.gtag("event", "page_view", {
    send_to: measurementId,
    page_title: document.title,
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
  });
}

export default function AnalyticsConsent({
  measurementId,
}: AnalyticsConsentProps) {
  const pathname = usePathname();
  const [consent, setConsentState] =
    useState<ConsentValue | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const lastTrackedUrlRef = useRef<string | null>(null);

  function trackCurrentPage(): void {
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (lastTrackedUrlRef.current === currentUrl) {
      return;
    }

    sendPageView(measurementId);
    lastTrackedUrlRef.current = currentUrl;
  }

  useEffect(() => {
    ensureGtag();

    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500,
    });

    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (
      storedValue === "granted" ||
      storedValue === "denied"
    ) {
      setConsentState(storedValue);
      setIsPanelOpen(false);
      setConsent(storedValue);

      if (storedValue === "granted") {
        loadGoogleAnalytics(measurementId, trackCurrentPage);
      }
    } else {
      setIsPanelOpen(true);
    }

    setIsReady(true);
  }, [measurementId]);

  useEffect(() => {
    if (consent !== "granted") {
      return;
    }

    loadGoogleAnalytics(measurementId, trackCurrentPage);
  }, [pathname, consent, measurementId]);

  function saveConsent(value: ConsentValue): void {
    window.localStorage.setItem(STORAGE_KEY, value);

    setConsentState(value);
    setConsent(value);
    setIsPanelOpen(false);

    if (value === "granted") {
      loadGoogleAnalytics(measurementId, trackCurrentPage);
    }
  }

  if (!isReady) {
    return null;
  }

  return (
    <>
      {isPanelOpen && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Analytics preferences"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-white/[0.1] bg-[#070a12]/95 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:p-5"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <p className="text-[0.56rem] font-black uppercase tracking-[0.16em] text-red-400">
                Analytics preferences
              </p>

              <h2 className="mt-2 text-lg font-black">
                Help improve the Atlas.
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Google Analytics helps us understand traffic and improve the
                site. Advertising storage stays disabled. You can reject
                analytics and change this choice later.
              </p>
            </div>

            <div className="grid gap-2 sm:min-w-[12rem]">
              <button
                type="button"
                onClick={() => saveConsent("granted")}
                className="rounded-xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400"
              >
                Accept analytics
              </button>

              <button
                type="button"
                onClick={() => saveConsent("denied")}
                className="rounded-xl border border-white/[0.1] bg-black/25 px-4 py-3 text-sm font-black text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
              >
                Reject
              </button>
            </div>
          </div>
        </section>
      )}

      {!isPanelOpen && consent !== null && (
        <button
          type="button"
          onClick={() => setIsPanelOpen(true)}
          aria-label="Open cookie settings"
          title="Cookie settings"
          className="fixed bottom-2 right-2 z-[90] rounded-full border border-white/[0.07] bg-[#070a12]/85 px-2 py-1 text-[0.46rem] font-black uppercase tracking-[0.08em] text-slate-600 shadow-sm backdrop-blur transition hover:border-cyan-500/35 hover:text-cyan-300 sm:bottom-3 sm:right-3"
        >
          Cookies
        </button>
      )}
    </>
  );
}
