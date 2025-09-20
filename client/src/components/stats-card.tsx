import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative";
  iconBgColor: string;
  iconColor: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = "positive",
  iconBgColor,
  iconColor,
}: StatsCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium" data-testid={`stats-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground" data-testid={`stats-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`${iconColor} h-5 w-5`} />
        </div>
      </div>
      {change && (
        <div className="flex items-center mt-4 text-sm">
          <span className={`flex items-center ${changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
            {change}
          </span>
          <span className="text-muted-foreground ml-2">from last month</span>
        </div>
      )}
    </div>
  );
}
