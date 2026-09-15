"use client";

import { useEffect, useRef } from "react";
import { onScrollFrame, ScrollOrder } from "@/lib/scroll-ticker";

/**
 * Full-viewport hero. It is fixed behind the page so the sections below scroll
 * up over a video that never moves. The clip carries its own titles, so nothing
 * is laid over it beyond the gradients that keep the header readable and blend
 * the bottom edge into the next section.
 */
export function Hero() {
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);

  // Being fixed, the hero stays "on screen" as far as the compositor is
  // concerned even once it is fully covered. Pausing it then frees a
  // full-screen 1080p decode for the rest of the page. The check rides the
  // shared ticker so it does not add a second scroll listener next to Lenis.
  useEffect(() => {
    const mobileVideo = mobileVideoRef.current;
    const desktopVideo = desktopVideoRef.current;

    const setupVideo = (video: HTMLVideoElement | null) => {
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    };

    setupVideo(mobileVideo);
    setupVideo(desktopVideo);

    let covered: boolean | null = null;

    const isMobileBreakpoint = () => {
      return (
        window.matchMedia("(max-width: 767px)").matches ||
        /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent)
      );
    };

    const getActiveVideo = () => {
      return isMobileBreakpoint() ? mobileVideo : desktopVideo;
    };

    const getInactiveVideo = () => {
      return isMobileBreakpoint() ? desktopVideo : mobileVideo;
    };

    const tryPlayActive = () => {
      const active = getActiveVideo();
      const inactive = getInactiveVideo();

      if (inactive && !inactive.paused) {
        inactive.pause();
      }

      if (active) {
        const promise = active.play();
        if (promise !== undefined) {
          promise.catch(() => {
            // Unlock on first user interaction if iOS Low Power Mode blocks autoplay
            const unlock = () => {
              getActiveVideo()?.play().catch(() => {});
              window.removeEventListener("touchstart", unlock);
              window.removeEventListener("touchend", unlock);
              window.removeEventListener("scroll", unlock);
              window.removeEventListener("click", unlock);
            };

            window.addEventListener("touchstart", unlock, {
              passive: true,
              once: true,
            });
            window.addEventListener("touchend", unlock, {
              passive: true,
              once: true,
            });
            window.addEventListener("scroll", unlock, {
              passive: true,
              once: true,
            });
            window.addEventListener("click", unlock, {
              passive: true,
              once: true,
            });
          });
        }
      }
    };

    // Start playing the relevant video immediately
    tryPlayActive();

    const mql = window.matchMedia("(max-width: 767px)");
    const handleMediaChange = () => {
      tryPlayActive();
    };

    mql.addEventListener("change", handleMediaChange);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !covered) {
        tryPlayActive();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handleVisibilityChange);

    const check = (scroll: number) => {
      const next = scroll > window.innerHeight * 0.9;
      if (next === covered) return;
      covered = next;
      if (next) {
        mobileVideo?.pause();
        desktopVideo?.pause();
      } else {
        tryPlayActive();
      }
    };

    check(window.scrollY);
    const unbindScroll = onScrollFrame(check, ScrollOrder.Effect);

    return () => {
      unbindScroll();
      mql.removeEventListener("change", handleMediaChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handleVisibilityChange);
    };
  }, []);

  return (
    <section
      aria-labelledby="hero-heading"
      className="fixed inset-x-0 top-0 z-0 min-h-140 overflow-hidden bg-bg landscape:min-h-svh md:min-h-180"
      style={{ height: "100svh" }}
    >
      {/* The showreel carries its own titles, so the page's heading is rendered
          for crawlers and screen readers rather than drawn a second time over
          footage that already says it. */}
      <h1 id="hero-heading" className="sr-only">
        Bring your events to life with Topaz — a leading event management
        company in Sharjah, Dubai and Abu Dhabi
      </h1>

      {/* Mobile Video: rendered and displayed strictly on mobile screens (< 768px) */}
      <video
        ref={mobileVideoRef}
        className="pointer-events-none size-full object-cover md:hidden"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/mobile-poster.webp"
        aria-hidden="true"
        style={{
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
        }}
        disablePictureInPicture
        disableRemotePlayback
      >
        <source src="/mobile.mp4" type="video/mp4" />
      </video>

      {/* Desktop Video: rendered and displayed strictly on desktop screens (>= 768px) */}
      <video
        ref={desktopVideoRef}
        className="pointer-events-none size-full object-cover hidden md:block"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/hero-poster.webp"
        aria-hidden="true"
        style={{
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
        }}
        disablePictureInPicture
        disableRemotePlayback
      >
        <source src="/home.mp4" type="video/mp4" />
      </video>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/60 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-bg/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(224,194,110,0.10) 0%, rgba(224,194,110,0) 45%)",
        }}
      />
    </section>
  );
}
