import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BOOT_LINES } from "../config/boot-sequence";
import type { BootLineType } from "../config/boot-sequence";
import { NAV_LINKS } from "../config/data";
import type { ThemeKey } from "../config/themes";
import { THEMES } from "../config/themes";

export interface TerminalHeroProps {
  theme: ThemeKey;
  onBootComplete?: () => void;
}

export function TerminalHero({ theme, onBootComplete }: TerminalHeroProps) {
  type DisplayLine = { text: string; type: BootLineType };

  const [lines, setLines] = useState<DisplayLine[]>([]);
  const [bootDone, setBootDone] = useState(false);
  const [typing, setTyping] = useState<DisplayLine | null>(null);
  const cancelRef = useRef(false);
  const bootStartedRef = useRef(false);
  const t = THEMES[theme];

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runBoot = useCallback(async () => {
    if (bootStartedRef.current) return;
    bootStartedRef.current = true;

    cancelRef.current = false;
    setLines([]);
    setBootDone(false);
    setTyping(null);

    for (const line of BOOT_LINES) {
      if (cancelRef.current) break;

      if (line.type === "glitch") {
        continue;
      }

      if (line.typeSpeed) {
        for (let i = 0; i <= line.text.length; i++) {
          if (cancelRef.current) break;
          setTyping({ text: line.text.slice(0, i), type: line.type });
          await sleep(line.typeSpeed);
        }
        setLines((prev) => [...prev, { text: line.text, type: line.type }]);
        setTyping(null);
      } else {
        setLines((prev) => [...prev, { text: line.text, type: line.type }]);
      }

      if (!cancelRef.current) await sleep(line.delay);
    }

    setBootDone(true);
    onBootComplete?.();
  }, [onBootComplete]);

  const skipBoot = useCallback(() => {
    cancelRef.current = true;
    setTyping(null);
    const finalLines: DisplayLine[] = BOOT_LINES.filter(
      (l) => l.type !== "glitch",
    ).map((l) => ({ text: l.text, type: l.type }));
    setLines(finalLines);
    setBootDone(true);
    onBootComplete?.();
  }, [onBootComplete]);

  useEffect(() => {
    queueMicrotask(() => {
      void runBoot();
    });
    return () => {
      // If the component unmounts mid-boot (hot reload, etc.), stop the
      // async loop so it doesn't setState on an unmounted tree.
      cancelRef.current = true;
    };
  }, [runBoot]);

  const getLineColor = (type: string): string => {
    switch (type) {
      case "ok":
        return t.primary;
      case "warn":
        return "#ffaa00";
      case "dim":
        return t.dim;
      case "name":
        return t.primary;
      case "role":
        return t.secondary;
      default:
        return t.dim;
    }
  };

  const getLineStyle = (type: string): CSSProperties => {
    const base: CSSProperties = {
      color: getLineColor(type),
      margin: 0,
      whiteSpace: "pre",
    };

    if (type === "name") {
      return {
        ...base,
        fontSize: "clamp(20px, 5vw, 32px)",
        fontWeight: 700,
        letterSpacing: "3px",
      };
    }

    if (type === "role") {
      return {
        ...base,
        fontSize: "clamp(14px, 3vw, 18px)",
      };
    }

    return {
      ...base,
      fontSize: "13px",
    };
  };

  return (
    <section
      id="hero"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.85)",
          border: `1px solid ${t.darkDim}`,
          borderRadius: "8px",
          width: "100%",
          maxWidth: "720px",
          overflow: "hidden",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: `1px solid ${t.darkDim}`,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#ff5f57",
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#ffbd2e",
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#28c940",
            }}
          />
          <span
            style={{
              color: "#666",
              fontSize: "12px",
              marginLeft: "8px",
            }}
          >
            ransys.dev — zsh
          </span>
        </div>

        <div
          style={{
            padding: "20px 24px 28px",
            fontSize: "13px",
            lineHeight: 1.7,
            minHeight: "340px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              width: "100%",
              height: "3px",
              background: t.scanline,
              animation: "scanlineMove 4s linear infinite",
              pointerEvents: "none",
            }}
          />

          {lines.map((line, i) => (
            <div key={i} style={getLineStyle(line.type)}>
              {line.text || "\u00A0"}
            </div>
          ))}

          {typing && (
            <div style={getLineStyle(typing.type)}>
              {typing.text}
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "14px",
                  background: t.primary,
                  marginLeft: "2px",
                  verticalAlign: "text-bottom",
                  animation: "cursorBlink 0.7s step-end infinite",
                }}
              />
            </div>
          )}

          {bootDone && (
            <>
              <div style={{ height: "16px" }} />
              <NavLinks theme={theme} />
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "14px",
                  background: t.primary,
                  verticalAlign: "text-bottom",
                  animation: "cursorBlink 0.7s step-end infinite",
                  marginTop: "8px",
                }}
              />
            </>
          )}

          {!bootDone && (
            <button
              type="button"
              onClick={skipBoot}
              aria-label="Skip boot sequence"
              style={{
                position: "absolute",
                bottom: "12px",
                right: "16px",
                background: "transparent",
                border: `1px solid ${t.dim}`,
                color: t.dim,
                fontFamily: "inherit",
                fontSize: "11px",
                padding: "4px 14px",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = t.primary;
                e.currentTarget.style.borderColor = t.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = t.dim;
                e.currentTarget.style.borderColor = t.dim;
              }}
            >
              skip &gt;
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

interface NavLinksProps {
  theme: ThemeKey;
}

function NavLinks({ theme }: NavLinksProps) {
  const t = THEMES[theme];

  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          style={{
            color: t.dim,
            fontSize: "13px",
            textDecoration: "none",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = t.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = t.dim;
          }}
        >
          {link.heroLabel}
        </a>
      ))}
    </div>
  );
}
