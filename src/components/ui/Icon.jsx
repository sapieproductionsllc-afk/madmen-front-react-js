// Icône Material Symbols arrondie (chargée via Google Fonts dans index.html)
export default function Icon({ name, className = "", filled = false, style = {} }) {
  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{
        ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}),
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
