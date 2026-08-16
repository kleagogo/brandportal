/* eslint-disable */
// @ts-nocheck
'use client'

/**
 * VENDORED — transitions.dev Pro. Do not hand-edit.
 *
 * Kept byte-close to `transitions/<id>/react.md` so a recipe update can be
 * diffed against it. Typechecking is off for the same reason: the recipes ship
 * untyped JSX, and retyping ~2,000 lines of physics/canvas code would fork them
 * from upstream and risk changing behaviour.
 *
 * The seam IS typed: import these through `./index.ts`, which declares the props
 * this app actually passes. Nothing outside this directory sees `any`.
 */

/* transitions.dev Pro — organic-shimmer. Vendored from transitions/organic-shimmer/react.md.
   Typed for this codebase; behaviour unchanged. */

export function OrganicShimmer({ width = 142, height = 142, radius = 12, playing = true }) {
  // The recipe geometry (overhang, edge belts, ring stroke, blurs) is tuned
  // for a 142px tile — scale it by the smaller side so the effect keeps its
  // proportions on larger and smaller cards.
  const scale = Math.min(width, height) / 142;
  return (
    <>
      <div
        className="t-shimmer-tile"
        aria-hidden
        data-playing={playing ? undefined : "false"}
        style={{ width, height, borderRadius: radius, "--shimmer-scale": scale }}
      >
        <span className="t-shimmer"><span className="t-shimmer-band" /></span>
        <span className="t-shimmer-edge">
          <span className="t-shimmer-edge-bloom" />
          <span className="t-shimmer-edge-glow" />
          <span className="t-shimmer-edge-ring" />
        </span>
      </div>
      <ShimmerWarpFilter />
    </>
  );
}

/** The fractal-noise displacement field that waves the band — once per page. */
function ShimmerWarpFilter() {
  if (typeof document !== "undefined" && document.getElementById("t-shimmer-warp")) {
    return null;
  }
  return (
    <svg
      width={0}
      height={0}
      style={{ position: "absolute" }}
      aria-hidden
      focusable="false"
    >
      <filter id="t-shimmer-warp" x="-40%" y="-40%" width="180%" height="180%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.009 0.015"
          numOctaves={2}
          seed={7}
          result="n"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n"
          scale={46}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
