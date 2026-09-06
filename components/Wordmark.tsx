import Link from "next/link";

export function Wordmark({
  href = "/",
  size = 34,
  wordSize = 19,
  color,
}: {
  href?: string;
  size?: number;
  wordSize?: number;
  color?: string;
}) {
  const bolt = Math.round(size * 0.54);
  return (
    <Link href={href} className="rl-wordmark" style={color ? { color } : undefined}>
      <span
        className="rl-glyph"
        style={{
          width: size,
          height: size,
          borderRadius: size >= 32 ? 9 : 8,
        }}
      >
        <svg width={bolt} height={bolt} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fff" />
        </svg>
      </span>
      <span className="rl-wordmark-text" style={{ fontSize: wordSize }}>
        rushline
      </span>
    </Link>
  );
}
