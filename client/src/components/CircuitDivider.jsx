/**
 * Short circuit-trace divider: three solder points and a hollow ring joined by a right-angle trace
 * (as in the page heroes). Parts carry data-draw / data-node so a parent can animate them in.
 */
export default function CircuitDivider({ className = "", svgRef }) {
  return (
    <svg ref={svgRef} aria-hidden="true" width="168" height="26" viewBox="0 0 168 26" fill="none" className={`block overflow-visible ${className}`}>
      <path data-draw="" pathLength="1" d="M5 6 H72 V20 H163" stroke="#F5A623" strokeOpacity="0.7" strokeWidth="1.3" strokeLinejoin="round" />
      {[[5, 6, 0], [72, 6, 0.4], [72, 20, 0.5]].map(([x, y, at]) => <circle key={`${x}${y}`} data-node={at} cx={x} cy={y} r="2.6" fill="#F5A623" />)}
      <circle data-node="1" cx="163" cy="20" r="4" fill="none" stroke="#F5A623" strokeWidth="1.3" />
    </svg>
  )
}
