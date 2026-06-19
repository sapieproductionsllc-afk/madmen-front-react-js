import Icon from "./Icon.jsx";

// En-tête de section : titre + action optionnelle.
export default function SectionHeader({ icon, title, action, className = "" }) {
  return (
    <div className={`flex items-end justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-2.5">
        {icon && <Icon name={icon} className="text-brand-600 text-[22px]" />}
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
      </div>
      {action && (
        <button className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors shrink-0">
          {action}
          <Icon name="arrow_forward" className="text-[18px]" />
        </button>
      )}
    </div>
  );
}
