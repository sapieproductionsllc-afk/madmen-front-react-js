import Icon from "./Icon.jsx";

const variants = {
  primary: "bg-brand-600 text-canvas hover:bg-brand-700 shadow-sm",
  secondary: "bg-surface-2 text-texte border border-border-strong hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-texte",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
  "danger-soft": "bg-rose-400/10 text-rose-400 hover:bg-rose-400/15",
};

const sizes = {
  sm: "px-2.5 py-1.5 text-xs gap-1",
  md: "px-3.5 py-2 text-sm",
  lg: "px-4 py-2.5 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition duration-150 ease-out focus-visible:outline-none focus-visible:shadow-focus active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 ${
        variants[variant] ?? variants.primary
      } ${sizes[size] ?? sizes.md} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} className="text-[18px]" />}
      {children}
      {iconRight && <Icon name={iconRight} className="text-[18px]" />}
    </button>
  );
}
