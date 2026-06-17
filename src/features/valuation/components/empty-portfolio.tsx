import { Database } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyPortfolio() {
  return (
    <div className="p-8">
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <Database className="mx-auto h-10 w-10 text-gray-300" />
        <h3 className="mt-3 text-base font-semibold text-dark-gray">
          No instruments loaded
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Load the sample portfolio or upload a CSV file from the Data Manager.
        </p>
        <Link
          to="/valuation/data-manager"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-mid-red"
        >
          Go to Data Manager
        </Link>
      </div>
    </div>
  );
}
