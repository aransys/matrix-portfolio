import { useEffect, useRef, useState } from "react";
import { SOCIALS } from "../config/data";
import type { SocialLink } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";
import { cardStyle } from "../styles/tokens";
import { Section } from "./Section";

export interface ContactSectionProps {
  theme: ThemeKey;
}

/** How long the "copied ✓" pill stays on screen after a successful copy. */
const COPY_FEEDBACK_MS = 1800;

/** mailto:/tel: links are the only ones we copy on click — every other URL
 *  stays a plain navigation. Returns the raw value (email or phone) stripped
 *  of the protocol, or null if the href shouldn't trigger copy behaviour. */
function extractCopyableValue(href: string): string | null {
  if (href.startsWith("mailto:")) return href.slice("mailto:".length);
  if (href.startsWith("tel:")) return href.slice("tel:".length);
  return null;
}

export function ContactSection({ theme }: ContactSectionProps) {
  const t = THEMES[theme];
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  // Keep the timer id in a ref so re-rendering (e.g. theme switch) doesn't
  // race with the hide timeout.
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
      // Clipboard access can fail (insecure context, permissions). Fall
      // through silently and let the default mailto: behaviour take over.
    }
  };

  return (
    <Section
      id="contact"
      theme={theme}
      tag="// 05"
      title="Transmission"
      paddingBottom={80}
    >
      <div style={cardStyle(t)}>
        <p
          style={{
            fontSize: "14px",
            color: t.secondary,
            lineHeight: 1.8,
            margin: "0 0 28px",
          }}
        >
          Open to internships, freelance projects, and collaboration.
          <br />
          Send a signal — I'll respond from the construct.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          {SOCIALS.map((social) => {
            const copyValue = extractCopyableValue(social.href);
            const isCopyable = copyValue !== null;
            const isCopied = copiedLabel === social.label;

            const commonStyle: React.CSSProperties = {
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              background: t.glowSoft,
              border: `1px solid ${t.darkDim}`,
              borderRadius: "6px",
              textDecoration: "none",
              transition: "all 0.2s ease",
              textAlign: "left",
              font: "inherit",
              cursor: "pointer",
              width: "100%",
            };

            const commonOnEnter = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.borderColor = t.dim;
              e.currentTarget.style.background = t.pillBg;
            };
            const commonOnLeave = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.borderColor = t.darkDim;
              e.currentTarget.style.background = t.glowSoft;
            };

            const inner = (
              <>
                <span style={{ fontSize: "16px", color: t.primary }}>
                  {social.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "10px",
                      color: t.dim,
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                    }}
                  >
                    {social.label}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: t.primary,
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
                      color: isCopied ? t.primary : t.darkDim,
                      letterSpacing: "1.5px",
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

            if (isCopyable) {
              return (
                <button
                  key={social.label}
                  type="button"
                  aria-label={`Copy ${social.label.toLowerCase()}: ${social.value}`}
                  onClick={() => handleCopy(social, copyValue)}
                  style={commonStyle}
                  onMouseEnter={commonOnEnter}
                  onMouseLeave={commonOnLeave}
                >
                  {inner}
                </button>
              );
            }

            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${social.label}: ${social.value}`}
                style={commonStyle}
                onMouseEnter={commonOnEnter}
                onMouseLeave={commonOnLeave}
              >
                {inner}
              </a>
            );
          })}
        </div>
      </div>

      <footer
        style={{
          textAlign: "center",
          marginTop: "60px",
          fontSize: "12px",
          color: t.darkDim,
        }}
      >
        <div style={{ marginBottom: "8px" }}>
          Built with React + TypeScript + Framer Motion
        </div>
        <div>© {new Date().getFullYear()} Aurimas Ransys — ransys.dev</div>
        <div style={{ marginTop: "4px", fontSize: "11px", color: t.darkDim }}>
          &ldquo;There is no spoon.&rdquo;
        </div>
      </footer>
    </Section>
  );
}
