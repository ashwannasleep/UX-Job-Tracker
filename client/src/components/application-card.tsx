import { JobApplication } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ApplicationCardProps {
  application: JobApplication;
  onEdit: (application: JobApplication) => void;
  onDelete: (id: string) => void;
}

const statusColors = {
  applied: "status-applied",
  interview: "status-interview",
  offer: "status-offer",
  rejected: "status-rejected",
};

export default function ApplicationCard({ application, onEdit, onDelete }: ApplicationCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 14) return "1 week ago";
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return format(date, "MMM d, yyyy");
  };

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors" data-testid={`application-card-${application.id}`}>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h4 className="font-medium text-foreground" data-testid={`application-position-${application.id}`}>
            {application.position}
          </h4>
          <p className="text-muted-foreground text-sm" data-testid={`application-company-${application.id}`}>
            {application.company}
          </p>
          <p className="text-muted-foreground text-xs" data-testid={`application-date-${application.id}`}>
            Applied {formatDate(application.applicationDate)}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Badge 
          className={cn("text-xs font-medium", statusColors[application.status as keyof typeof statusColors])}
          data-testid={`application-status-${application.id}`}
        >
          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
        </Badge>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(application)}
            data-testid={`button-edit-${application.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(application.id)}
            className="text-destructive hover:text-destructive"
            data-testid={`button-delete-${application.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
