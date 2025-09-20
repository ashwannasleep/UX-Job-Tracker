import { CheckCircle, Calendar, Send, X, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineItemProps {
  type: "offer" | "interview" | "application" | "rejection" | "update";
  title: string;
  description: string;
  timestamp: string;
}

const iconMap = {
  offer: CheckCircle,
  interview: Calendar,
  application: Send,
  rejection: X,
  update: Edit,
};

const colorMap = {
  offer: "bg-green-100 text-green-600",
  interview: "bg-blue-100 text-blue-600",
  application: "bg-purple-100 text-purple-600",
  rejection: "bg-red-100 text-red-600",
  update: "bg-gray-100 text-gray-600",
};

export default function TimelineItem({ type, title, description, timestamp }: TimelineItemProps) {
  const Icon = iconMap[type];
  const colorClass = colorMap[type];

  return (
    <div className="flex items-start space-x-3" data-testid={`timeline-item-${type}`}>
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground" data-testid={`timeline-title-${type}`}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground" data-testid={`timeline-description-${type}`}>
          {description}
        </p>
        <p className="text-xs text-muted-foreground" data-testid={`timeline-timestamp-${type}`}>
          {timestamp}
        </p>
      </div>
    </div>
  );
}
