import { StatCard, StatCardGrid } from "../..";
import { S } from "../helpers";
import { BarChart2, AlertTriangle, TrendingUp, User, Bell } from "lucide-react";

export function StatCardsSection() {
  return (
    <S label="Stat Cards">
      <StatCardGrid>
        <StatCard
          title="Total Portfolio"
          value="₦14.2B"
          subtitle="as of Dec 2024"
          trend={{ direction: "up", label: "+8.3% YoY" }}
          icon={<BarChart2 className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Total ECL Charge"
          value="₦1.84B"
          trend={{ direction: "down", label: "−2.1% QoQ" }}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="highlight"
        />
        <StatCard
          title="Stage 3 Ratio"
          value="4.72%"
          subtitle="above 5% triggers review"
          trend={{ direction: "up", label: "+0.3pp" }}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Defaulted Loans"
          value="₦672M"
          trend={{ direction: "up", label: "+12.4%" }}
          icon={<User className="h-5 w-5" />}
          variant="danger"
        />
      </StatCardGrid>
      <StatCardGrid>
        <StatCard
          title="Loading state"
          value=""
          loading
          icon={<Bell className="h-5 w-5" />}
        />
        <StatCard title="Loading state" value="" loading />
      </StatCardGrid>
    </S>
  );
}
