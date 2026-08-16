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

/* transitions.dev Pro — pro-gradient-text. Vendored from transitions/pro-gradient-text/react.md.
   Typed for this codebase; behaviour unchanged. */

export function GradientText({
  children,
  as: Tag = "span",
  hueDur,
  driftDur,
  className,
}) {
  const style = {};
  if (hueDur) style["--gradient-text-hue-dur"] = hueDur;
  if (driftDur) style["--gradient-text-drift-dur"] = driftDur;
  return (
    <Tag
      className={"t-gradient-text" + (className ? " " + className : "")}
      style={style}
    >
      {children}
    </Tag>
  );
}
