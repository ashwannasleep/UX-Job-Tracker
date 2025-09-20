import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Trash2, Edit, Phone, Video, Building, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import InterviewForm from "./interview-form";
import type { Interview } from "@shared/schema";
import { useState } from "react";

const interviewTypeIcons = {
  phone: Phone,
  video: Video,
  onsite: Building,
  final: Award,
};

const interviewTypeLabels = {
  phone: "Phone Screen",
  video: "Video Call",
  onsite: "On-site",
  final: "Final Round",
};

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  rescheduled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

interface InterviewListProps {
  applicationId: string;
}

export default function InterviewList({ applicationId }: InterviewListProps) {
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: interviews = [], isLoading } = useQuery<Interview[]>({
    queryKey: ["/api/applications", applicationId, "interviews"],
  });

  const deleteMutation = useMutation({
    mutationFn: (interviewId: string) =>
      apiRequest("DELETE", `/api/interviews/${interviewId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interviews", "upcoming"] });
      toast({ title: "Interview deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete interview", variant: "destructive" });
    },
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: ({ interviewId, feedback }: { interviewId: string; feedback: string }) =>
      apiRequest("PUT", `/api/interviews/${interviewId}`, { feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "interviews"] });
      toast({ title: "Feedback updated successfully!" });
      setEditingFeedback(null);
      setFeedbackText("");
    },
    onError: () => {
      toast({ title: "Failed to update feedback", variant: "destructive" });
    },
  });

  const handleDeleteInterview = (interviewId: string) => {
    deleteMutation.mutate(interviewId);
  };

  const handleSaveFeedback = (interviewId: string) => {
    updateFeedbackMutation.mutate({ interviewId, feedback: feedbackText });
  };

  const startEditingFeedback = (interview: Interview) => {
    setEditingFeedback(interview.id);
    setFeedbackText(interview.feedback || "");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Interviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading interviews...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Interviews ({interviews.length})
        </CardTitle>
        <InterviewForm applicationId={applicationId} />
      </CardHeader>
      <CardContent>
        {interviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No interviews scheduled yet</p>
            <p className="text-sm">Click "Schedule Interview" to add one</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview: Interview) => {
              const IconComponent = interviewTypeIcons[interview.interviewType as keyof typeof interviewTypeIcons];
              const typeLabel = interviewTypeLabels[interview.interviewType as keyof typeof interviewTypeLabels];
              
              return (
                <div
                  key={interview.id}
                  className="border rounded-lg p-4 space-y-3"
                  data-testid={`interview-card-${interview.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium" data-testid={`interview-type-${interview.id}`}>
                            {typeLabel}
                            {(interview.round || 1) > 1 && (
                              <span className="text-muted-foreground"> - Round {interview.round || 1}</span>
                            )}
                          </h4>
                          <Badge 
                            className={statusColors[interview.status as keyof typeof statusColors]}
                            data-testid={`interview-status-${interview.id}`}
                          >
                            {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span data-testid={`interview-date-${interview.id}`}>
                              {format(new Date(interview.scheduledDate), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          {interview.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{interview.duration} min</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <InterviewForm 
                        applicationId={applicationId} 
                        interview={interview}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-delete-interview-${interview.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Interview</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this interview? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteInterview(interview.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {(interview.interviewerName || interview.interviewerEmail || interview.location) && (
                    <>
                      <Separator />
                      <div className="grid gap-2 text-sm">
                        {interview.interviewerName && (
                          <div>
                            <span className="font-medium">Interviewer: </span>
                            <span data-testid={`interview-interviewer-${interview.id}`}>
                              {interview.interviewerName}
                              {interview.interviewerEmail && ` (${interview.interviewerEmail})`}
                            </span>
                          </div>
                        )}
                        {interview.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span data-testid={`interview-location-${interview.id}`}>
                              {interview.location}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {interview.notes && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-sm font-medium">Notes:</Label>
                        <p className="text-sm text-muted-foreground mt-1" data-testid={`interview-notes-${interview.id}`}>
                          {interview.notes}
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Feedback:</Label>
                      {editingFeedback !== interview.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingFeedback(interview)}
                          data-testid={`button-edit-feedback-${interview.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {interview.feedback ? "Edit" : "Add"} Feedback
                        </Button>
                      )}
                    </div>
                    
                    {editingFeedback === interview.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Add interview feedback, impressions, next steps..."
                          rows={3}
                          data-testid={`textarea-feedback-${interview.id}`}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFeedback(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveFeedback(interview.id)}
                            disabled={updateFeedbackMutation.isPending}
                            data-testid={`button-save-feedback-${interview.id}`}
                          >
                            Save Feedback
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground" data-testid={`interview-feedback-${interview.id}`}>
                        {interview.feedback || "No feedback added yet"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}