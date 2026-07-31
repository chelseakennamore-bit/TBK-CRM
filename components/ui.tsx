import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const TAG_STYLES: Record<string, string> = {
  accent:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  "accent-2":
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  neutral: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  outline:
    "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300",
};

export function Tag({
  variant = "neutral",
  children,
  className,
}: {
  variant?: "accent" | "accent-2" | "neutral" | "outline";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TAG_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const BUTTON_VARIANTS: Record<string, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300",
  secondary:
    "bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

export function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        BUTTON_VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "secondary",
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <a
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        BUTTON_VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}

const controlClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(controlClass, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(controlClass, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(controlClass, className)} {...props} />;
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-max border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

export function Th({ children }: { children?: ReactNode }) {
  return (
    <th className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cx(
        "border-b border-zinc-100 px-3 py-2 align-middle dark:border-zinc-800",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</div>
    </div>
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
      {...props}
    />
  );
}
