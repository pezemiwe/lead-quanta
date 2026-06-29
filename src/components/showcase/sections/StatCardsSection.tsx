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
          title="Active Deals"
          value="24"
          trend={{ direction: "up", label: "+4 this week" }}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="highlight"
        />
        <StatCard
          title="Weighted Avg Yield"
          value="18.42%"
          subtitle="portfolio weighted"
          trend={{ direction: "up", label: "+0.3pp" }}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Pending Approvals"
          value="6"
          trend={{ direction: "up", label: "2 high priority" }}
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
