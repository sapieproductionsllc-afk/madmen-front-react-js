import Icon from "./Icon.jsx";

export default function SearchInput({ value, onChange, placeholder = "Rechercher…", className = "" }) {
  return (
    <div
      className={`flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500/30 transition ${className}`}
    >
      <Icon name="search" className="text-slate-400 text-[18px] mr-2" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none text-sm w-full text-slate-700"
        type="text"
      />
    </div>
  );
}
