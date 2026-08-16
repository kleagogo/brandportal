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

/* transitions.dev Pro — card-stack-hover. Vendored from transitions/card-stack-hover/react.md.
   Typed for this codebase; behaviour unchanged. */

const DEFAULT_SLOTS = [
  { cx: "28px", cy: "20px", rot: "4deg", dx: "2px", dy: "-26px", drot: "7deg" },
  { cx: "12px", cy: "20px", rot: "-8deg", dx: "-4px", dy: "-6px", drot: "-7deg" },
  { cx: "21px", cy: "26px", rot: "0deg", dx: "2px", dy: "26px", drot: "4deg" },
];

export function CardStack({ slots = DEFAULT_SLOTS }) {
  return (
    <div className="t-stack" aria-label="Card stack">
      {slots.map((s, i) => (
        <button
          key={i}
          type="button"
          className="t-stack-card"
          style={{
            "--cx": s.cx,
            "--cy": s.cy,
            "--rot": s.rot,
            "--dx": s.dx,
            "--dy": s.dy,
            "--drot": s.drot,
            zIndex: i,
          }}
        >
          {s.content}
        </button>
      ))}
    </div>
  );
}
