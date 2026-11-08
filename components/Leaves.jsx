const Leaf = ({ r, s = 1, c }) => (
  <g transform={`rotate(${r}) scale(${s})`}>
    <path d="M0 0C25-45 80-55 125-32C100 14 45 34 0 0Z" fill={c} />
    <path d="M0 0C35-16 70-24 118-30" stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" />
  </g>
);
export default function Leaves() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg className="absolute right-0 top-0 h-72 w-72 opacity-80" viewBox="0 0 260 260"><g transform="translate(262 -4)">
        <Leaf r={100} s={1.1} c="#6FA35A" /><Leaf r={125} c="#4A8C3F" /><Leaf r={150} s={.95} c="#8DBB6E" /><Leaf r={172} s={.8} c="#5E9A49" /></g></svg>
      <svg className="absolute bottom-0 left-0 h-80 w-80 opacity-80" viewBox="0 0 260 260"><g transform="translate(-4 264)">
        <Leaf r={-80} s={1.1} c="#6FA35A" /><Leaf r={-55} c="#4A8C3F" /><Leaf r={-30} s={.95} c="#8DBB6E" /><Leaf r={-8} s={.8} c="#5E9A49" /></g></svg>
    </div>
  );
}
