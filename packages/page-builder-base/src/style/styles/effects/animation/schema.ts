import * as z from "zod";

// Animation name options
export const animationNameKeys = [
  "none",
  "reveal",
  "fadeIn",
  "fadeOut",
  "slideInLeft",
  "slideInRight",
  "slideInUp",
  "slideInDown",
  "slideOutLeft",
  "slideOutRight",
  "slideOutUp",
  "slideOutDown",
  "scaleIn",
  "scaleOut",
  "bounceIn",
  "bounceOut",
  "rotateIn",
  "rotateOut",
  "flipInX",
  "flipOutX",
  "flipInY",
  "flipOutY",
  "zoomIn",
  "zoomOut",
  "pulse",
  "shake",
  "wiggle",
  "tada",
  "swing",
  "rubberBand",
  "lightSpeedIn",
  "lightSpeedOut",
  "hinge",
  "rollIn",
  "rollOut",
  "blink",
] as const;

export const animationNameKeyMap = {
  none: "none",
  reveal: "reveal",
  fadeIn: "fadeIn",
  fadeOut: "fadeOut",
  slideInLeft: "slideInLeft",
  slideInRight: "slideInRight",
  slideInUp: "slideInUp",
  slideInDown: "slideInDown",
  slideOutLeft: "slideOutLeft",
  slideOutRight: "slideOutRight",
  slideOutUp: "slideOutUp",
  slideOutDown: "slideOutDown",
  scaleIn: "scaleIn",
  scaleOut: "scaleOut",
  bounceIn: "bounceIn",
  bounceOut: "bounceOut",
  rotateIn: "rotateIn",
  rotateOut: "rotateOut",
  flipInX: "flipInX",
  flipOutX: "flipOutX",
  flipInY: "flipInY",
  flipOutY: "flipOutY",
  zoomIn: "zoomIn",
  zoomOut: "zoomOut",
  pulse: "pulse",
  shake: "shake",
  wiggle: "wiggle",
  tada: "tada",
  swing: "swing",
  rubberBand: "rubberBand",
  lightSpeedIn: "lightSpeedIn",
  lightSpeedOut: "lightSpeedOut",
  hinge: "hinge",
  rollIn: "rollIn",
  rollOut: "rollOut",
  blink: "blink",
} as const;

// Animation direction options
export const animationDirectionKeys = [
  "normal",
  "reverse",
  "alternate",
  "alternate-reverse",
] as const;

export const animationDirectionKeyMap = {
  normal: "normal",
  reverse: "reverse",
  alternate: "alternate",
  "alternate-reverse": "alternate_reverse",
} as const;

// Animation timing function options
export const animationTimingFunctionKeys = [
  "ease",
  "linear",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "step-start",
  "step-end",
] as const;

export const animationTimingFunctionKeyMap = {
  ease: "ease",
  linear: "linear",
  "ease-in": "ease_in",
  "ease-out": "ease_out",
  "ease-in-out": "ease_in_out",
  "step-start": "step_start",
  "step-end": "step_end",
} as const;

// Animation fill mode options
export const animationFillModeKeys = [
  "none",
  "forwards",
  "backwards",
  "both",
] as const;

export const animationFillModeKeyMap = {
  none: "none",
  forwards: "forwards",
  backwards: "backwards",
  both: "both",
} as const;

// Animation iteration count options
export const animationIterationCountKeys = ["infinite", "custom"] as const;

export const animationIterationCountKeyMap = {
  infinite: "infinite",
  custom: "custom",
} as const;

// Combined animation schema
export const AnimationSchema = z.object({
  name: z.enum(animationNameKeys),
  duration: z.number().min(0).max(10).step(0.1),
  iterationCount: z.union([
    z.enum(animationIterationCountKeys),
    z.number().int().min(1).max(100),
  ]),
  direction: z.enum(animationDirectionKeys),
  timingFunction: z.enum(animationTimingFunctionKeys),
  fillMode: z.enum(animationFillModeKeys),
  delay: z.number().min(0).max(10).step(0.1),
});

export type AnimationStyleConfiguration = z.infer<typeof AnimationSchema>;
