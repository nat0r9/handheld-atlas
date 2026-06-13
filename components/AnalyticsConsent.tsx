"use client";

import {
  useEffect,
  useState,
} from "react";

type ConsentValue =
  | "granted"
  | "denied";

interface AnalyticsConsentProps {
  measurementId: string;
}

const STORAGE_KEY =
  "handheldatlas-analytics-consent-v1";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (
      command: string,
      target: string,
      config?: Record<
        string,
        unknown
      >,
    ) => void;
  }
}

function ensureGtag() {
  window.dataLayer =
    window.dataLayer ?? [];

  window.gtag =
    window.gtag ??
    function gtag() {
      window.dataLayer.push(
        arguments,
      );
    };
}

function setConsent(
  value: ConsentValue,
) {
  ensureGtag();

  window.gtag(
    "consent",
    "update",
    {
      analytics_storage: value,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization:
        "denied",
    },
  );
}

function loadGoogleAnalytics(
  measurementId: string,
) {
  ensureGtag();

  if (
    document.getElementById(
      "handheldatlas-google-analytics",
    )
  ) {
    return;
  }

  const script =
    document.createElement(
      "script",
    );

  script.id =
    "handheldatlas-google-analytics";

  script.async = true;

  script.src =
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      measurementId,
    )}`;

  script.onload = () => {
    ensureGtag();

    window.gtag(
      "js",
      new Date().toISOString(),
    );

    window.gtag(
      "config",
      measurementId,
      {
        send_page_view: true,
        cookie_flags:
          "SameSite=None;Secure",
      },
    );
  };

  document.head.appendChild(script);
}

export default function AnalyticsConsent({
  measurementId,
}: AnalyticsConsentProps) {
  const [
    consent,
    setConsentState,
  ] = useState<
    ConsentValue | null
  >(null);

  const [
    isReady,
    setIsReady,
  ] = useState(false);

  const [
    isPanelOpen,
    setIsPanelOpen,
  ] = useState(false);

  useEffect(() => {
    ensureGtag();

    window.gtag(
      "consent",
      "default",
      {
        analytics_storage:
          "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization:
          "denied",
        wait_for_update: 500,
      },
    );

    const storedValue =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    if (
      storedValue ===
        "granted" ||
      storedValue === "denied"
    ) {
      setConsentState(
        storedValue,
      );

      setConsent(
        storedValue,
      );

      if (
        storedValue ===
        "granted"
      ) {
        loadGoogleAnalytics(
          measurementId,
        );
      }
    } else {
      setIsPanelOpen(true);
    }

    setIsReady(true);
  }, [measurementId]);

  function saveConsent(
    value: ConsentValue,
  ) {
    window.localStorage.setItem(
      STORAGE_KEY,
      value,
    );

    setConsentState(value);
    setConsent(value);
    setIsPanelOpen(false);

    if (value === "granted") {
      loadGoogleAnalytics(
        measurementId,
      );
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
                Google Analytics helps us understand traffic and improve the site.
                Advertising storage stays disabled. You can reject analytics and
                change this choice later.
              </p>
            </div>

            <div className="grid gap-2 sm:min-w-[12rem]">
              <button
                type="button"
                onClick={() =>
                  saveConsent(
                    "granted",
                  )
                }
                className="rounded-xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400"
              >
                Accept analytics
              </button>

              <button
                type="button"
                onClick={() =>
                  saveConsent(
                    "denied",
                  )
                }
                className="rounded-xl border border-white/[0.1] bg-black/25 px-4 py-3 text-sm font-black text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
              >
                Reject
              </button>
            </div>
          </div>
        </section>
      )}

      {!isPanelOpen &&
        consent !== null && (
          <button
            type="button"
            onClick={() =>
              setIsPanelOpen(true)
            }
            className="fixed bottom-3 right-3 z-[90] rounded-full border border-white/[0.08] bg-[#070a12]/90 px-3 py-2 text-[0.55rem] font-black uppercase tracking-[0.12em] text-slate-500 shadow-lg backdrop-blur transition hover:border-cyan-500/40 hover:text-cyan-300"
          >
            Cookie settings
          </button>
        )}
    </>
  );
}
