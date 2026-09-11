import { useId } from "react";

function BeanPaths() {
  return (
    <g transform="rotate(-35 12 12)">
      <ellipse cx="12" cy="12" rx="6" ry="8.5" />
      <path d="M12 3.5c-2.2 2.6-2.2 5.6 0 8.5s2.2 5.9 0 8.5" />
    </g>
  );
}

export function Bean({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <BeanPaths />
    </svg>
  );
}

export function Stamp({ text, className = "" }: { text: string; className?: string }) {
  const id = useId();

  return (
    <svg viewBox="0 0 200 200" aria-hidden className={className}>
      <defs>
        <path id={id} d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
      </defs>
      <circle cx="100" cy="100" r="97" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 5" />
      <text fill="currentColor" fontSize="12.5" fontWeight="700" style={{ fontFamily: "var(--font-body)" }}>
        <textPath href={`#${id}`} textLength="474" lengthAdjust="spacing">
          {text.toUpperCase()}
        </textPath>
      </text>
      <g
        transform="translate(70 70) scale(2.5)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      >
        <BeanPaths />
      </g>
    </svg>
  );
}

export function Score({ value, large = false }: { value: string; large?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 flex-col items-center justify-center rounded-full border border-accent text-accent ${
        large ? "size-20" : "size-14"
      }`}
    >
      <span className={`font-display leading-none ${large ? "text-2xl" : "text-lg"}`}>
        {value}
      </span>
      <span className="mt-0.5 text-[0.6rem] font-semibold tracking-[0.14em]">SCA</span>
    </span>
  );
}
