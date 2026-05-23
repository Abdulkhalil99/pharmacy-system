'use client';

interface PrintButtonProps {
  label?: string;
}

export function PrintButton({ label = 'Print Report' }: PrintButtonProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => window.print()}
        className="print-hidden inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M6 9V4h12v5M6 18H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2v5a2 2 0 01-2 2h-1m-12 0h12v2H6v-2zm2-4h8v4H8v-4z"
          />
        </svg>
        {label}
      </button>

      <style jsx global>{`
        @media print {
          .reports-print-shell {
            background: white !important;
            padding: 0 !important;
          }

          .reports-print-shell .print-hidden {
            display: none !important;
          }

          .report-print-card {
            break-inside: avoid;
            box-shadow: none !important;
            border-color: #cbd5e1 !important;
            background: white !important;
            backdrop-filter: none !important;
          }

          .report-print-stack {
            display: block !important;
          }

          .report-print-stack > * {
            margin-bottom: 16px !important;
          }

          .report-print-table {
            overflow: visible !important;
          }
        }
      `}</style>
    </>
  );
}
