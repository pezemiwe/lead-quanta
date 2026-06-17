import { Save } from "lucide-react";

export function ModuleSettings() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure benchmarks, limits, and notification preferences
        </p>
      </div>

      {/* benchmark */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-dark-gray">
          Benchmark Configuration
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Primary Benchmark
            </label>
            <select className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
              <option>NGSE All-Share Index (ASI)</option>
              <option>NGSE 30 Index</option>
              <option>S&amp;P Pan Africa Index</option>
              <option>Custom Blended Benchmark</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Rebalancing Frequency
            </label>
            <select className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
              <option>Quarterly</option>
              <option>Monthly</option>
              <option>Semi-Annual</option>
              <option>Annual</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Base Currency
            </label>
            <select className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
              <option>NGN — Nigerian Naira</option>
              <option>USD — US Dollar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Fiscal Year End
            </label>
            <select className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
              <option>December 31</option>
              <option>March 31</option>
              <option>June 30</option>
            </select>
          </div>
        </div>
      </div>

      {/* risk limits */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-dark-gray">Risk Limits</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Max Single Issuer (%)", default: "10" },
            { label: "Max Equity Allocation (%)", default: "30" },
            { label: "Max Cash Allocation (%)", default: "15" },
            { label: "VaR Alert Threshold (%)", default: "2.0" },
            { label: "Tracking Error Limit (%)", default: "3.0" },
            { label: "Max Drawdown Alert (%)", default: "5.0" },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {f.label}
              </label>
              <input
                type="number"
                defaultValue={f.default}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {/* notifications */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-dark-gray">
          Notification Preferences
        </h2>
        {[
          "Limit breach alerts",
          "Daily portfolio summary email",
          "Transaction settlement confirmations",
          "Monthly report availability",
          "VaR threshold breach",
        ].map((item) => (
          <label
            key={item}
            className="flex items-center gap-3 text-sm text-gray-600"
          >
            <input type="checkbox" defaultChecked className="accent-primary" />
            {item}
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-mid-red">
          <Save className="h-4 w-4" /> Save Settings
        </button>
      </div>
    </div>
  );
}
