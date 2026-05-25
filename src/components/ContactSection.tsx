import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SOCIALS } from "../config/data";
import type { SocialLink } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { Section } from "./Section";

export interface ContactSectionProps {
  theme: ThemeKey;
}

const COPY_FEEDBACK_MS = 1800;

/** Returns the raw value of a mailto:/tel: link, or null otherwise. */
function extractCopyableValue(href: string): string | null {
  if (href.startsWith("mailto:")) return href.slice(7);
  if (href.startsWith("tel:")) return href.slice(4);
  return null;
}

/**
 * Contact — clean glass tile grid. Email/phone tiles act as copy-buttons
 * with inline confirmation; remote services open in a new tab.
 */
export function ContactSection({ theme }: ContactSectionProps) {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleCopy = async (social: SocialLink, copyValue: string) => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopiedLabel(social.label);
      if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setCopiedLabel(null);
        hideTimerRef.current = null;
      }, COPY_FEEDBACK_MS);
    } catch {
      // Permissions / insecure context — let the default link behaviour win.
    }
  };

  return (
    <Section
      id="contact"
      theme={theme}
      tag="05"
      title="Send Signal"
      subtitle="Open to internships, freelance work, and the occasional good problem."
      paddingBottom={80}
    >
      <div
        className="glass glass--raised"
        style={{
          padding: "clamp(24px, 3vw + 12px, 36px)",
          position: "relative",
        }}
      >
        <span className="scanline" />

        <p
          style={{
            fontSize: "var(--t-base)",
            color: "var(--c-secondary)",
            lineHeight: 1.8,
            margin: "0 0 28px",
            maxWidth: "60ch",
          }}
        >
          Choose your channel — I&apos;ll respond from the construct.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "12px",
          }}
        >
          {SOCIALS.map((social, i) => {
            const copyValue = extractCopyableValue(social.href);
            const isCopyable = copyValue !== null;
            const isCopied = copiedLabel === social.label;

            const tileStyle: React.CSSProperties = {
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "16px 18px",
              background: "var(--c-glow-soft)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--r-md)",
              textDecoration: "none",
              textAlign: "left",
              font: "inherit",
              cursor: "pointer",
              width: "100%",
              transition: "all 0.2s ease",
            };

            const onEnter = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.borderColor = "var(--c-border-strong)";
              e.currentTarget.style.background = "var(--c-pill-bg)";
              e.currentTarget.style.transform = "translateY(-2px)";
            };
            const onLeave = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.borderColor = "var(--c-border)";
              e.currentTarget.style.background = "var(--c-glow-soft)";
              e.currentTarget.style.transform = "translateY(0)";
            };

            const inner = (
              <>
                <span
                  aria-hidden
                  style={{
                    fontSize: "18px",
                    color: "var(--c-primary)",
                    width: "24px",
                    textAlign: "center",
                  }}
                >
                  {social.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="tag" style={{ marginBottom: "2px" }}>
                    {social.label}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--t-sm)",
                      color: "var(--c-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {social.value}
                  </div>
                </div>
                {isCopyable && (
                  <span
                    aria-live="polite"
                    style={{
                      fontSize: "10px",
                      color: isCopied ? "var(--c-primary)" : "var(--c-dark-dim)",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      transition: "color 0.2s ease, opacity 0.2s ease",
                      opacity: isCopied ? 1 : 0.7,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isCopied ? "copied ✓" : "copy"}
                  </span>
                )}
              </>
            );

            const motionProps = {
              initial: { opacity: 0, y: 12 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, margin: "-30px" },
              transition: { duration: 0.4, delay: i * 0.06 },
            } as const;

            if (isCopyable) {
              return (
                <motion.button
                  key={social.label}
                  type="button"
                  aria-label={`Copy ${social.label.toLowerCase()}: ${social.value}`}
                  onClick={() => handleCopy(social, copyValue)}
                  style={tileStyle}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                  {...motionProps}
                >
                  {inner}
                </motion.button>
              );
            }

            return (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${social.label}: ${social.value}`}
                style={tileStyle}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
                {...motionProps}
              >
                {inner}
              </motion.a>
            );
          })}
        </div>
      </div>

      <footer
        style={{
          textAlign: "center",
          marginTop: "60px",
          fontSize: "var(--t-sm)",
          color: "var(--c-dark-dim)",
        }}
      >
        <div style={{ marginBottom: "8px" }}>
          Built with React 19 · TypeScript · Framer Motion · WebGL
        </div>
        <div>
          © {new Date().getFullYear()} Aurimas Ransys — ransys.dev
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "var(--c-dark-dim)",
            fontStyle: "italic",
          }}
        >
          &ldquo;There is no spoon.&rdquo;
        </div>
      </footer>
    </Section>
  );
}
