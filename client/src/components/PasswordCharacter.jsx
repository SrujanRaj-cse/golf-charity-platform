import React, { useEffect, useMemo, useRef } from "react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function PasswordCharacter({ coverEyes }) {
  const wrapperRef = useRef(null);
  const leftPupilGroupRef = useRef(null);
  const rightPupilGroupRef = useRef(null);

  const rafRef = useRef(null);
  const targetRef = useRef({ ox: 0, oy: 0 });
  const currentRef = useRef({ ox: 0, oy: 0 });

  const config = useMemo(() => {
    return {
      maxOffset: 2.2,
      ease: 0.16
    };
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const left = leftPupilGroupRef.current;
    const right = rightPupilGroupRef.current;
    if (!wrapper || !left || !right) return;

    const reset = () => {
      targetRef.current = { ox: 0, oy: 0 };
      currentRef.current = { ox: 0, oy: 0 };
      left.setAttribute("transform", "translate(0 0)");
      right.setAttribute("transform", "translate(0 0)");
    };

    if (coverEyes) {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      reset();
      return;
    }

    const onMove = (e) => {
      const rect = wrapper.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      targetRef.current.ox = clamp(dx, -1, 1) * config.maxOffset;
      targetRef.current.oy = clamp(dy, -1, 1) * (config.maxOffset * 0.55);

      if (!rafRef.current) {
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = null;
          const { ease } = config;

          const { ox: curX, oy: curY } = currentRef.current;
          const { ox: tgtX, oy: tgtY } = targetRef.current;

          currentRef.current.ox = curX + (tgtX - curX) * ease;
          currentRef.current.oy = curY + (tgtY - curY) * ease;

          const { ox, oy } = currentRef.current;
          left.setAttribute("transform", `translate(${ox} ${oy})`);
          right.setAttribute("transform", `translate(${ox} ${oy})`);
        });
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      reset();
    };
  }, [coverEyes, config]);

  return (
    <div ref={wrapperRef} className="w-full md:w-[340px] lg:w-[380px] mx-auto" aria-hidden="true">
      <svg viewBox="0 0 300 240" className="w-full h-auto drop-shadow-sm">
        <defs>
          <linearGradient id="orangeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.35)" />
            <stop offset="60%" stopColor="rgba(249, 115, 22, 0.24)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.04)" />
          </linearGradient>
          <linearGradient id="panelPurple" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.95)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.55)" />
          </linearGradient>
          <linearGradient id="panelYellow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(250, 204, 21, 0.95)" />
            <stop offset="100%" stopColor="rgba(250, 204, 21, 0.55)" />
          </linearGradient>
        </defs>

        {/* Subtle aura */}
        <circle cx="150" cy="120" r="120" fill="rgba(52,211,153,0.08)" opacity="0.9" />

        {/* Back panels (geometric, like the reference) */}
        <rect x="92" y="50" width="58" height="140" rx="10" fill="url(#panelPurple)" />
        <rect x="160" y="80" width="56" height="110" rx="10" fill="url(#panelYellow)" />

        {/* Decorative small “face dots” on panels */}
        <circle cx="117" cy="86" r="3" fill="rgba(17,24,39,0.9)" />
        <circle cx="140" cy="86" r="3" fill="rgba(17,24,39,0.9)" />
        <path d="M188 144c0 6-14 6-14 0" stroke="rgba(17,24,39,0.85)" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Main orange semicircle */}
        <path
          d="M60 195 A90 90 0 0 1 240 195 L240 225 L60 225 Z"
          fill="url(#orangeGrad)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.2"
        />

        {/* Eyes base (dark) */}
        <g opacity="0.95">
          <ellipse cx="128" cy="162" rx="16" ry="9" fill="rgba(17,24,39,0.78)" />
          <ellipse cx="172" cy="162" rx="16" ry="9" fill="rgba(17,24,39,0.78)" />
        </g>

        {/* Pupils (translate within eye sockets) */}
        <g ref={leftPupilGroupRef} transform="translate(0 0)">
          <circle cx="128" cy="162" r="6.4" fill="rgba(34,211,238,0.78)" />
          <circle cx="130.6" cy="160.2" r="2.2" fill="rgba(255,255,255,0.48)" />
        </g>
        <g ref={rightPupilGroupRef} transform="translate(0 0)">
          <circle cx="172" cy="162" r="6.4" fill="rgba(34,211,238,0.78)" />
          <circle cx="174.6" cy="160.2" r="2.2" fill="rgba(255,255,255,0.48)" />
        </g>

        {/* Cover-eyes overlay (hands/mask) */}
        <g className="transition-opacity duration-200" style={{ opacity: coverEyes ? 1 : 0 }}>
          <rect x="111" y="147" width="34" height="22" rx="11" fill="rgba(15,23,42,0.90)" />
          <rect x="155" y="147" width="34" height="22" rx="11" fill="rgba(15,23,42,0.90)" />
          <path
            d="M118 158c7-6 16-6 24 0"
            stroke="rgba(34,211,238,0.25)"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M162 158c7-6 16-6 24 0"
            stroke="rgba(34,211,238,0.25)"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Mouth */}
        <path d="M120 190c18 10 42 10 60 0" stroke="rgba(17,24,39,0.55)" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

