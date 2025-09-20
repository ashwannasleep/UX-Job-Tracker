import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, Clock, Calendar, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { JobApplication } from "@shared/schema";
import { Link } from "wouter";

interface DeadlineRemindersProps {
  className?: string;
}

export function DeadlineReminders({ className }: DeadlineRemindersProps) {
  const { data: upcomingDeadlines = [], isLoading: upcomingLoading } = useQuery<JobApplication[]>({
    queryKey: ["/api/deadlines/upcoming"],
  });

  const { data: overdueDeadlines = [], isLoading: overdueLoading } = useQuery<JobApplication[]>({
    queryKey: ["/api/deadlines/overdue"],
  });

  if (upcomingLoading || overdueLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Deadline Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasReminders = overdueDeadlines.length > 0 || upcomingDeadlines.length > 0;

  if (!hasReminders) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Deadline Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No upcoming deadlines or overdue items.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Deadline Reminders
          {(overdueDeadlines.length > 0 || upcomingDeadlines.length > 0) && (
            <Badge variant="secondary" className="ml-2">
              {overdueDeadlines.length + upcomingDeadlines.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue Deadlines */}
        {overdueDeadlines.length > 0 && (
          <div className="space-y-2">
            <Alert variant="destructive" data-testid="alert-overdue-deadlines">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Overdue Items ({overdueDeadlines.length})</AlertTitle>
              <AlertDescription>
                You have {overdueDeadlines.length} overdue deadline{overdueDeadlines.length > 1 ? 's' : ''} that need attention.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              {overdueDeadlines.map((app) => (
                <DeadlineItem
                  key={app.id}
                  application={app}
                  isOverdue={true}
                  data-testid={`deadline-overdue-${app.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Separator between overdue and upcoming */}
        {overdueDeadlines.length > 0 && upcomingDeadlines.length > 0 && (
          <Separator className="my-4" />
        )}

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">
              Upcoming This Week ({upcomingDeadlines.length})
            </h4>
            <div className="space-y-2">
              {upcomingDeadlines.map((app) => (
                <DeadlineItem
                  key={app.id}
                  application={app}
                  isOverdue={false}
                  data-testid={`deadline-upcoming-${app.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DeadlineItemProps {
  application: JobApplication;
  isOverdue: boolean;
  "data-testid"?: string;
}

function DeadlineItem({ application, isOverdue, "data-testid": testId }: DeadlineItemProps) {
  const formatDeadlineDate = (date: string | Date) => {
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const getDaysFromNow = (date: string | Date) => {
    try {
      const target = new Date(date);
      const today = new Date();
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`;
      } else if (diffDays === 0) {
        return "Due today";
      } else if (diffDays === 1) {
        return "Due tomorrow";
      } else {
        return `Due in ${diffDays} days`;
      }
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 border rounded-lg transition-colors hover:bg-accent/50",
        isOverdue ? "border-destructive/50 bg-destructive/5" : "border-border"
      )}
      data-testid={testId}
    >
      <div className="flex items-center space-x-3">
        <div className={cn(
          "w-2 h-2 rounded-full flex-shrink-0",
          isOverdue ? "bg-destructive" : "bg-orange-500"
        )} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm" data-testid={`deadline-position-${application.id}`}>
            {application.position}
          </p>
          <p className="text-muted-foreground text-xs" data-testid={`deadline-company-${application.id}`}>
            {application.company}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className="text-sm font-medium" data-testid={`deadline-date-${application.id}`}>
            {application.nextStepDate && formatDeadlineDate(application.nextStepDate)}
          </p>
          <p className={cn(
            "text-xs",
            isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
          )} data-testid={`deadline-status-${application.id}`}>
            {application.nextStepDate && getDaysFromNow(application.nextStepDate)}
          </p>
        </div>
        <Link href={`/applications/${application.id}`}>
          <Button variant="ghost" size="sm" data-testid={`button-view-deadline-${application.id}`}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}