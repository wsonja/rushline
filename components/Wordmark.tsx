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
  const tri = size >= 32 ? 5 : 4;
  const triH = size >= 32 ? 9 : 8;
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
        <span
          className="rl-glyph-tri"
          style={{
            borderLeftWidth: tri,
            borderRightWidth: tri,
            borderBottomWidth: triH,
          }}
        />
      </span>
      <span className="rl-wordmark-text" style={{ fontSize: wordSize }}>
        rushline
      </span>
    </Link>
  );
}
