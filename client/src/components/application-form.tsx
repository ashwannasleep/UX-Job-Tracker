import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertJobApplicationSchema, type InsertJobApplication, type JobApplication } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ApplicationFormProps {
  application?: JobApplication;
  onClose?: () => void;
}

export default function ApplicationForm({ application, onClose }: ApplicationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InsertJobApplication>({
    resolver: zodResolver(insertJobApplicationSchema),
    defaultValues: {
      company: application?.company || "",
      position: application?.position || "",
      status: application?.status || "applied",
      applicationDate: application?.applicationDate 
        ? new Date(application.applicationDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      salary: application?.salary || undefined,
      location: application?.location || "",
      jobUrl: application?.jobUrl || "",
      notes: application?.notes || "",
      contactEmail: application?.contactEmail || "",
      contactName: application?.contactName || "",
      nextStepDate: application?.nextStepDate 
        ? new Date(application.nextStepDate).toISOString().split('T')[0]
        : undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertJobApplication) => {
      const response = await apiRequest("POST", "/api/applications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Application created successfully",
      });
      form.reset();
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create application",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertJobApplication) => {
      const response = await apiRequest("PUT", `/api/applications/${application!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertJobApplication) => {
    setIsSubmitting(true);
    try {
      if (application) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Company Name*</Label>
          <Input
            id="company"
            {...form.register("company")}
            placeholder="e.g., Google"
            data-testid="input-company"
          />
          {form.formState.errors.company && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.company.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="position">Position*</Label>
          <Input
            id="position"
            {...form.register("position")}
            placeholder="e.g., Senior Frontend Developer"
            data-testid="input-position"
          />
          {form.formState.errors.position && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.position.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={form.watch("status")} 
            onValueChange={(value) => form.setValue("status", value)}
          >
            <SelectTrigger data-testid="select-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="applicationDate">Application Date</Label>
          <Input
            id="applicationDate"
            type="date"
            {...form.register("applicationDate")}
            data-testid="input-application-date"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salary">Salary</Label>
          <Input
            id="salary"
            type="number"
            {...form.register("salary", { valueAsNumber: true })}
            placeholder="e.g., 100000"
            data-testid="input-salary"
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            {...form.register("location")}
            placeholder="e.g., San Francisco, CA"
            data-testid="input-location"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="jobUrl">Job URL</Label>
        <Input
          id="jobUrl"
          type="url"
          {...form.register("jobUrl")}
          placeholder="https://..."
          data-testid="input-job-url"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactName">Contact Name</Label>
          <Input
            id="contactName"
            {...form.register("contactName")}
            placeholder="e.g., John Doe"
            data-testid="input-contact-name"
          />
        </div>
        <div>
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            {...form.register("contactEmail")}
            placeholder="john@company.com"
            data-testid="input-contact-email"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="nextStepDate">Next Step Date</Label>
        <Input
          id="nextStepDate"
          type="date"
          {...form.register("nextStepDate")}
          data-testid="input-next-step-date"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          placeholder="Any additional notes..."
          rows={3}
          data-testid="textarea-notes"
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isSubmitting}
          data-testid="button-submit-application"
        >
          {isSubmitting ? "Saving..." : application ? "Update Application" : "Add Application"}
        </Button>
        {onClose && (
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1"
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
