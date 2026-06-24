import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = "emerald",
}: {
  label: string;
  value: string;
  caption?: string;
  icon: LucideIcon;
  tone?: "emerald" | "cyan" | "amber" | "blue" | "lime" | "slate";
}) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
    cyan: "border-cyan-100 bg-cyan-50/70 text-cyan-700",
    amber: "border-amber-100 bg-amber-50/70 text-amber-700",
    blue: "border-blue-100 bg-blue-50/70 text-blue-700",
    lime: "border-lime-100 bg-lime-50/70 text-lime-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className={cn("rounded-lg border p-4", tones[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="rounded-lg bg-white/80 p-2 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {caption && <p className="mt-3 text-xs leading-5 text-slate-500">{caption}</p>}
    </div>
  );
}

export function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

export const textareaClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

export function PrimaryButton({
  children,
  className,
  icon: Icon,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "blue" | "danger";
}) {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400",
    blue: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:text-red-300",
  };

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold shadow-sm transition disabled:opacity-70",
        variants[variant],
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function StatusAlert({
  children,
  tone = "amber",
}: {
  children: React.ReactNode;
  tone?: "amber" | "emerald" | "red" | "blue";
}) {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return <div className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone])}>{children}</div>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {href && actionLabel && (
        <Link
          href={href}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function UserBadge({ userId }: { userId: number | null }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      user_id: {userId ?? "未设置"}
    </span>
  );
}
