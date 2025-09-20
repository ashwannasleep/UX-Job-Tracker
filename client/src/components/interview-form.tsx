import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Interview, InterviewType, InterviewStatus } from "@shared/schema";

const interviewFormSchema = z.object({
  applicationId: z.string(),
  interviewType: z.enum(["phone", "video", "onsite", "final"]),
  scheduledDate: z.string().min(1, "Interview date is required"),
  duration: z.coerce.number().min(15).max(480).optional(),
  interviewerName: z.string().optional(),
  interviewerEmail: z.string().email().optional().or(z.literal("")),
  location: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "rescheduled"]).default("scheduled"),
  round: z.coerce.number().min(1).default(1),
});

type InterviewFormData = z.infer<typeof interviewFormSchema>;

interface InterviewFormProps {
  applicationId: string;
  interview?: Interview;
  onSuccess?: () => void;
}

export default function InterviewForm({ applicationId, interview, onSuccess }: InterviewFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InterviewFormData>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      applicationId,
      interviewType: interview?.interviewType as InterviewType || "phone",
      scheduledDate: interview?.scheduledDate ? new Date(interview.scheduledDate).toISOString().slice(0, 16) : "",
      duration: interview?.duration || 60,
      interviewerName: interview?.interviewerName || "",
      interviewerEmail: interview?.interviewerEmail || "",
      location: interview?.location || "",
      notes: interview?.notes || "",
      status: interview?.status as InterviewStatus || "scheduled",
      round: interview?.round || 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InterviewFormData) =>
      apiRequest("POST", "/api/interviews", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interviews", "upcoming"] });
      toast({ title: "Interview scheduled successfully!" });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to schedule interview", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InterviewFormData) =>
      apiRequest("PUT", `/api/interviews/${interview?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications", applicationId, "interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interviews", "upcoming"] });
      toast({ title: "Interview updated successfully!" });
      setOpen(false);
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update interview", variant: "destructive" });
    },
  });

  const onSubmit = (data: InterviewFormData) => {
    if (interview) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid={interview ? "button-edit-interview" : "button-schedule-interview"}>
          {interview ? (
            <>
              <Calendar className="h-4 w-4 mr-1" />
              Edit Interview
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Schedule Interview
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {interview ? "Edit Interview" : "Schedule Interview"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="interviewType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-interview-type">
                        <SelectValue placeholder="Select interview type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="phone">Phone Screen</SelectItem>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="final">Final Round</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time *</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      data-testid="input-interview-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="15"
                        max="480"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                        data-testid="input-interview-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="round"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Round</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-interview-round"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="interviewerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interviewer Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-interviewer-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interviewerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interviewer Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} data-testid="input-interviewer-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Meeting Link</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-interview-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-interview-status">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Interview notes, preparation topics, etc."
                      rows={3}
                      data-testid="textarea-interview-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} data-testid="button-save-interview">
                {isLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  interview ? "Update Interview" : "Schedule Interview"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}