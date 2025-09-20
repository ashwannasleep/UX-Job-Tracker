import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building, MapPin, Calendar, DollarSign, ExternalLink, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import InterviewList from "@/components/interview-list";
import type { JobApplication } from "@shared/schema";

const statusColors = {
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  interview: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  offer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function ApplicationDetails() {
  const { id } = useParams();

  const { data: application, isLoading, error } = useQuery<JobApplication>({
    queryKey: ["/api/applications", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Application Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The job application you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="h-8 w-px bg-border"></div>
        <h1 className="text-2xl font-bold">Application Details</h1>
      </div>

      <div className="grid gap-6">
        {/* Application Overview */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1" data-testid="application-position">
                  {application.position}
                </h2>
                <p className="text-lg text-muted-foreground mb-2" data-testid="application-company">
                  {application.company}
                </p>
                <Badge 
                  className={statusColors[application.status as keyof typeof statusColors]}
                  data-testid="application-status"
                >
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Application
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Application Date</p>
                    <p className="text-sm text-muted-foreground" data-testid="application-date">
                      {format(new Date(application.applicationDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                
                {application.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground" data-testid="application-location">
                        {application.location}
                      </p>
                    </div>
                  </div>
                )}

                {application.salary && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Salary</p>
                      <p className="text-sm text-muted-foreground" data-testid="application-salary">
                        ${application.salary.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {application.contactName && (
                  <div>
                    <p className="text-sm font-medium">Contact Person</p>
                    <p className="text-sm text-muted-foreground" data-testid="application-contact">
                      {application.contactName}
                      {application.contactEmail && (
                        <span className="block text-xs">{application.contactEmail}</span>
                      )}
                    </p>
                  </div>
                )}

                {application.nextStepDate && (
                  <div>
                    <p className="text-sm font-medium">Next Step</p>
                    <p className="text-sm text-muted-foreground" data-testid="application-next-step">
                      {format(new Date(application.nextStepDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}

                {application.jobUrl && (
                  <div>
                    <p className="text-sm font-medium">Job Posting</p>
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      data-testid="application-job-url"
                    >
                      View original posting
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {application.notes && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-sm font-medium mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="application-notes">
                    {application.notes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Interview Management */}
        <InterviewList applicationId={application.id} />

        {/* Application Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Application Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Application Submitted</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(application.applicationDate), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              
              {application.status !== "applied" && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Status Updated to {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(application.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}