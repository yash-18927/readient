const CENTER = { x: 170, y: 170 };

const NODES = [
  { label: "Resume", x: 52, y: 58, anchor: "start" as const, dy: -14 },
  { label: "Experience", x: 292, y: 70, anchor: "end" as const, dy: -14 },
  { label: "Skills", x: 46, y: 282, anchor: "start" as const, dy: 20 },
  { label: "Projects", x: 296, y: 274, anchor: "end" as const, dy: 20 },
];

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

/**
 * Static network diagram: four evidence nodes wired to a central "You" node.
 * Elements build in one at a time (~150ms apart, ~1.2s total), then settle
 * into a slow, low-amplitude idle pulse.
 */
export function HeroConstellation() {
  return (
    <svg
      viewBox="0 0 340 340"
      className="h-auto w-full max-w-[24rem]"
      role="img"
      aria-label="Network diagram connecting resume, experience, skills and projects to you"
    >
      {NODES.map((node, i) => (
        <line
          key={`line-${node.label}`}
          x1={node.x}
          y1={node.y}
          x2={CENTER.x}
          y2={CENTER.y}
          stroke="var(--border)"
          strokeWidth={1}
          className="constellation-in"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}

      {NODES.map((node, i) => (
        <g
          key={node.label}
          className="constellation-in constellation-drift"
          style={{
            animationDelay: `${600 + i * 150}ms, ${900 + i * 700}ms`,
            transformOrigin: `${node.x}px ${node.y}px`,
          }}
        >
          <circle cx={node.x} cy={node.y} r={4} fill="var(--muted-foreground)" />
          <text
            x={node.x}
            y={node.y + node.dy}
            textAnchor={node.anchor}
            className="fill-muted-foreground"
            style={{ ...MONO, fontSize: 8, letterSpacing: "0.12em" }}
          >
            {node.label.toUpperCase()}
          </text>
        </g>
      ))}

      <g
        className="constellation-in constellation-pulse"
        style={{
          animationDelay: "1050ms, 1400ms",
          transformOrigin: `${CENTER.x}px ${CENTER.y}px`,
        }}
      >
        <circle cx={CENTER.x} cy={CENTER.y} r={18} fill="var(--primary)" fillOpacity={0.12} />
        <circle cx={CENTER.x} cy={CENTER.y} r={7} fill="var(--primary)" />
        <text
          x={CENTER.x}
          y={CENTER.y + 30}
          textAnchor="middle"
          className="fill-primary"
          style={{ ...MONO, fontSize: 10, letterSpacing: "0.16em" }}
        >
          YOU
        </text>
      </g>
    </svg>
  );
}
