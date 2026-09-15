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
  const videoRef = useRef<HTMLVideoElement>(null);

  // Being fixed, the hero stays "on screen" as far as the compositor is
  // concerned even once it is fully covered. Pausing it then frees a
  // full-screen 1080p decode for the rest of the page. The check rides the
  // shared ticker so it does not add a second scroll listener next to Lenis.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Explicitly set muted & playsInline on the DOM object for Safari / iOS compatibility
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    let covered: boolean | null = null;

    const tryPlay = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // If autoplay is blocked by browser policy (e.g. iOS Low Power Mode),
          // resume playback on the first user interaction.
          const unlock = () => {
            video.play().catch(() => {});
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
    };

    // Attempt playback immediately
    tryPlay();

    // Listen to media query changes (viewport resize or orientation change)
    // to reload the video with the appropriate <source>
    const mql = window.matchMedia("(max-width: 768px)");
    const handleMediaChange = () => {
      video.load();
      tryPlay();
    };

    mql.addEventListener("change", handleMediaChange);

    // Resume playback when returning to the tab / Safari app
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !covered) {
        tryPlay();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handleVisibilityChange);

    const check = (scroll: number) => {
      const next = scroll > window.innerHeight * 0.9;
      if (next === covered) return;
      covered = next;
      if (next) video.pause();
      else tryPlay();
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

      <video
        ref={videoRef}
        className="pointer-events-none size-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero-poster.webp"
        aria-hidden="true"
        style={{
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
        }}
        disablePictureInPicture
        disableRemotePlayback
      >
        {/* Mobile video (up to 768px width) */}
        <source
          src="/mobile.mp4#t=0.001"
          type="video/mp4"
          media="(max-width: 768px)"
        />
        {/* Desktop video */}
        <source
          src="/home.mp4#t=0.001"
          type="video/mp4"
        />
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
