import Icon from "./Icon.jsx";

export default function SearchInput({ value, onChange, placeholder = "Rechercher…", className = "" }) {
  return (
    <div
      className={`flex items-center bg-canvas border border-border rounded-lg px-3 py-2 transition duration-150 ease-out focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15 ${className}`}
    >
      <Icon name="search" className="text-subtle text-[18px] mr-2" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="bg-transparent outline-none text-sm w-full text-texte placeholder:text-subtle"
        type="text"
      />
    </div>
  );
}
