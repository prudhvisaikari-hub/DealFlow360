import { QuoteStatus } from "@/lib/types";

interface StatusConfig {
  style: string;
  dotColor: string;
  hasPulse?: boolean;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  draft: {
    style: "bg-slate-100 text-slate-700 border-slate-200",
    dotColor: "bg-slate-400",
  },
  pending_manager_approval: {
    style: "bg-amber-50 text-amber-800 border-amber-200/80",
    dotColor: "bg-amber-500",
    hasPulse: true,
  },
  pending_finance_approval: {
    style: "bg-orange-50 text-orange-800 border-orange-200/80",
    dotColor: "bg-orange-500",
    hasPulse: true,
  },
  approved: {
    style: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    dotColor: "bg-emerald-500",
  },
  rejected: {
    style: "bg-rose-50 text-rose-800 border-rose-200/80",
    dotColor: "bg-rose-500",
  },
  sent: {
    style: "bg-blue-50 text-blue-800 border-blue-200/80",
    dotColor: "bg-blue-500",
  },
  under_negotiation: {
    style: "bg-purple-50 text-purple-800 border-purple-200/80",
    dotColor: "bg-purple-500",
    hasPulse: true,
  },
  confirmed: {
    style: "bg-teal-50 text-teal-800 border-teal-200/80",
    dotColor: "bg-teal-500",
  },
  fulfilling: {
    style: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
    dotColor: "bg-indigo-500",
    hasPulse: true,
  },
  billed: {
    style: "bg-emerald-100 text-emerald-900 border-emerald-300",
    dotColor: "bg-emerald-600",
  },
};

export function StatusBadge({ status }: { status: QuoteStatus | string }) {
  const config = STATUS_CONFIGS[status] ?? {
    style: "bg-slate-100 text-slate-700 border-slate-200",
    dotColor: "bg-slate-400",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${config.style}`}>
      <span className="relative flex h-1.5 w-1.5">
        {config.hasPulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dotColor}`} />
      </span>
      <span className="capitalize">{status.replace(/_/g, " ")}</span>
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const config =
    severity === "high"
      ? { style: "bg-rose-50 text-rose-800 border-rose-200", dot: "bg-rose-500" }
      : severity === "medium"
      ? { style: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" }
      : { style: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${config.style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span className="capitalize">{severity}</span>
    </span>
  );
}
