// Carte raffinée (voir la classe .card dans index.css).
export default function GlassCard({ className = "", hover = false, children, ...props }) {
  return (
    <div className={`card ${hover ? "card-hover" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}
