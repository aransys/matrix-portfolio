import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { OWNER, TIMELINE } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { eggBridge } from "../trail/eggBridge";
import { getFound, markFound, subscribeTrail, trailCount } from "../trail/trail";
import { Section } from "./Section";

export interface TimelineSectionProps {
  theme: ThemeKey;
}

/** Where the trace ends up — the oldest point on the path. */
const ORIGIN =
  OWNER.dossierFields.find((f) => f.label === "Origin")?.value ?? OWNER.location;

/** Vertical centre of a node marker, measured from the top of its entry. */
const NODE_CENTRE_PX = 16;

/**
 * Timeline — a call trace. The entries run from the present backwards, so
 * as the visitor scrolls a signal runs down the rail, locking each node as
 * it passes, until it reaches the origin. Under reduced motion the trace
 * is simply shown complete.
 */
export function TimelineSection({ theme }: TimelineSectionProps) {
  const reducedMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** Each node's position along the rail, 0–1. */
  const nodeStops = useRef<number[]>([]);
  const [lockedCount, setLockedCount] = useState(0);
  const [complete, setComplete] = useState(false);

  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 0.75", "end 0.8"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  const headTop = useTransform(progress, (v) => `${v * 100}%`);
  const headOpacity = useTransform(progress, [0, 0.03, 0.97, 1], [0, 1, 1, 0]);
  const percent = useTransform(progress, (v) => `${Math.round(v * 100)}%`);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const measure = () => {
      const height = rail.offsetHeight || 1;
      nodeStops.current = entryRefs.current.map((el) =>
        el ? (el.offsetTop + NODE_CENTRE_PX) / height : 1,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => observer.disconnect();
  }, []);

  useMotionValueEvent(progress, "change", (v) => {
    setLockedCount(nodeStops.current.filter((stop) => v >= stop).length);
    setComplete(v >= 0.985);
  });

  const originFound = useSyncExternalStore(subscribeTrail, getFound).includes("origin");
  const locked = reducedMotion ? TIMELINE.length : lockedCount;
  const traced = reducedMotion || complete;

  return (
    <Section
      id="timeline"
      theme={theme}
      tag="04"
      title="Trajectory"
      subtitle="Education, service, and the path that led here."
      contentStyle={{ position: "relative", paddingLeft: "44px" }}
    >
      <div ref={railRef} aria-hidden className="trace-rail">
        <motion.div
          className="trace-rail__fill"
          style={{ scaleY: reducedMotion ? 1 : progress }}
        />
        {!reducedMotion && (
          <motion.div
            className="trace-rail__head"
            style={{ top: headTop, opacity: headOpacity }}
          />
        )}
      </div>
      {TIMELINE.map((item, i) => {
        const isLocked = i < locked;
        const isLast = i === TIMELINE.length - 1;
        return (
          <motion.div
            key={item.title}
            ref={(el) => {
              entryRefs.current[i] = el;
            }}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            style={{
              marginBottom: isLast ? 0 : "36px",
              position: "relative",
            }}
          >
            <div
              aria-hidden
              className={`trace-node${isLocked ? " trace-node--locked" : ""}`}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              className="glass"
              style={{
                padding: "20px 24px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--c-dim)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {item.period}
              </span>
              <h3
                className="font-display"
                style={{
                  fontSize: "var(--t-md)",
                  fontWeight: 700,
                  color: "var(--c-primary)",
                  margin: "6px 0 2px",
                  letterSpacing: "-0.01em",
                }}
              >
                {item.title}
              </h3>
              <div
                style={{
                  fontSize: "var(--t-sm)",
                  color: "var(--c-secondary)",
                  marginBottom: "10px",
                }}
              >
                {item.place}
              </div>
              <p
                style={{
                  fontSize: "var(--t-sm)",
                  color: "var(--c-dim)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {item.detail}
              </p>
            </div>
          </motion.div>
        );
      })}

      {traced ? (
        // Once the trace lands, the origin can be touched — a step on the trail.
        <button
          type="button"
          className={`trace-readout trace-readout--done${originFound ? "" : " trace-readout--live"}`}
          onClick={() => {
            const first = markFound("origin");
            eggBridge()?.showMessage(
              first
                ? `That is where the splinter started. [${trailCount(getFound())}]`
                : `Signal origin: ${ORIGIN}`,
              3400,
            );
          }}
        >
          <span aria-hidden className="trace-readout__mark">■</span> trace complete · signal origin:{" "}
          <span className="trace-readout__origin">{ORIGIN}</span>
          {!originFound && <span className="trace-readout__hint"> · touch to lock</span>}
        </button>
      ) : (
        <p aria-hidden className="trace-readout">
          <span className="trace-readout__mark trace-readout__mark--live">■</span> tracing signal…{" "}
          <motion.span>{percent}</motion.span>
        </p>
      )}
    </Section>
  );
}
