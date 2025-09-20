import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, FileText, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { SiLinkedin } from "react-icons/si";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LinkedInImportProps {
  isOpen: boolean;
  onClose: () => void;
}

interface JobData {
  title: string;
  company: string;
  location?: string;
  description?: string;
  jobUrl?: string;
  employmentType?: string;
}

export default function LinkedInImport({ isOpen, onClose }: LinkedInImportProps) {
  const { toast } = useToast();
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [csvData, setCsvData] = useState("");
  const [parsedJob, setParsedJob] = useState<JobData | null>(null);
  const [bulkResults, setBulkResults] = useState<any>(null);

  // Parse LinkedIn job mutation
  const parseJobMutation = useMutation({
    mutationFn: async ({ jobUrl, jobText }: { jobUrl?: string; jobText?: string }) => {
      const response = await apiRequest("POST", "/api/linkedin/parse-job", { jobUrl, jobText });
      return response.json();
    },
    onSuccess: (data) => {
      setParsedJob(data);
      toast({
        title: "Success",
        description: "LinkedIn job data parsed successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to parse LinkedIn job data",
        variant: "destructive",
      });
    },
  });

  // Create application from parsed job
  const createApplicationMutation = useMutation({
    mutationFn: async (jobData: JobData) => {
      const response = await apiRequest("POST", "/api/linkedin/create-application", { jobData });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Application created successfully!",
      });
      setParsedJob(null);
      setJobUrl("");
      setJobText("");
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create application",
        variant: "destructive",
      });
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (csvData: string) => {
      const response = await apiRequest("POST", "/api/linkedin/bulk-import", { csvData });
      return response.json();
    },
    onSuccess: (data) => {
      setBulkResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: `Successfully imported ${data.applications.length} applications!`,
      });
      setCsvData("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import applications",
        variant: "destructive",
      });
    },
  });

  const handleParseJob = () => {
    if (jobUrl.trim()) {
      parseJobMutation.mutate({ jobUrl: jobUrl.trim() });
    } else if (jobText.trim()) {
      parseJobMutation.mutate({ jobText: jobText.trim() });
    } else {
      toast({
        title: "Input Required",
        description: "Please provide either a LinkedIn job URL or paste job text",
        variant: "destructive",
      });
    }
  };

  const handleCreateApplication = () => {
    if (parsedJob) {
      // Validate required fields before creating
      if (!parsedJob.title || !parsedJob.company || 
          parsedJob.title.trim() === "" || parsedJob.company.trim() === "") {
        toast({
          title: "Missing Required Information",
          description: "Please ensure job title and company name are detected before creating the application.",
          variant: "destructive",
        });
        return;
      }
      createApplicationMutation.mutate(parsedJob);
    }
  };

  const handleBulkImport = () => {
    if (!csvData.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide CSV data to import",
        variant: "destructive",
      });
      return;
    }
    bulkImportMutation.mutate(csvData.trim());
  };

  const sampleCsv = `title,company,location,url,description
Senior Frontend Developer,Google,San Francisco CA,https://linkedin.com/jobs/view/123,React TypeScript position
Backend Engineer,Microsoft,Seattle WA,https://linkedin.com/jobs/view/456,Node.js API development
Product Manager,Meta,Menlo Park CA,https://linkedin.com/jobs/view/789,Social media platform PM role`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <SiLinkedin className="text-white h-4 w-4" />
            </div>
            LinkedIn Import
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Single Job
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paste Text
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Import
            </TabsTrigger>
          </TabsList>

          {/* Single Job Import */}
          <TabsContent value="single" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import from LinkedIn Job URL</CardTitle>
                <CardDescription>
                  Paste a LinkedIn job URL to automatically extract job details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="linkedin-url">LinkedIn Job URL</Label>
                  <Input
                    id="linkedin-url"
                    type="url"
                    placeholder="https://www.linkedin.com/jobs/view/1234567890"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    data-testid="input-linkedin-url"
                  />
                </div>
                <Button 
                  onClick={handleParseJob}
                  disabled={parseJobMutation.isPending || !jobUrl.trim()}
                  className="w-full"
                  data-testid="button-parse-linkedin-job"
                >
                  {parseJobMutation.isPending ? "Parsing..." : "Parse LinkedIn Job"}
                </Button>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Note: Due to LinkedIn's restrictions, automatic data extraction is limited. 
                    You may need to manually fill in some details after parsing.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Text Import */}
          <TabsContent value="text" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import from Pasted Text</CardTitle>
                <CardDescription>
                  Copy and paste job details from LinkedIn or any other source
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="job-text">Job Description Text</Label>
                  <Textarea
                    id="job-text"
                    placeholder="Senior Frontend Developer&#10;Google&#10;San Francisco, CA&#10;&#10;We are looking for a senior frontend developer..."
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                    rows={10}
                    data-testid="textarea-job-text"
                  />
                </div>
                <Button 
                  onClick={handleParseJob}
                  disabled={parseJobMutation.isPending || !jobText.trim()}
                  className="w-full"
                  data-testid="button-parse-job-text"
                >
                  {parseJobMutation.isPending ? "Parsing..." : "Parse Job Text"}
                </Button>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tip: Copy the job title, company, and description from LinkedIn and paste it here. 
                    Our parser will automatically extract the relevant information.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Import */}
          <TabsContent value="bulk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import from CSV</CardTitle>
                <CardDescription>
                  Import multiple job applications at once using CSV format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="csv-data">CSV Data</Label>
                  <Textarea
                    id="csv-data"
                    placeholder={sampleCsv}
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    rows={8}
                    data-testid="textarea-csv-data"
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Required columns:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">title</Badge>
                    <Badge variant="secondary">company</Badge>
                  </div>
                  <p className="mt-2 font-medium">Optional columns:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline">location</Badge>
                    <Badge variant="outline">url</Badge>
                    <Badge variant="outline">description</Badge>
                  </div>
                </div>

                <Button 
                  onClick={handleBulkImport}
                  disabled={bulkImportMutation.isPending || !csvData.trim()}
                  className="w-full"
                  data-testid="button-bulk-import"
                >
                  {bulkImportMutation.isPending ? "Importing..." : "Import Applications"}
                </Button>

                {bulkResults && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Successfully imported {bulkResults.applications.length} out of {bulkResults.totalProcessed} applications.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Parsed Job Preview */}
        {parsedJob && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Parsed Job Details</CardTitle>
              <CardDescription>
                Review the extracted information and create the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Position *</Label>
                  <p className={`text-sm font-medium ${!parsedJob.title || parsedJob.title.trim() === "" ? "text-red-600" : ""}`} data-testid="parsed-job-title">
                    {parsedJob.title || "⚠️ Not detected"}
                  </p>
                  {(!parsedJob.title || parsedJob.title.trim() === "") && (
                    <p className="text-xs text-red-600 mt-1">Required field missing</p>
                  )}
                </div>
                <div>
                  <Label>Company *</Label>
                  <p className={`text-sm font-medium ${!parsedJob.company || parsedJob.company.trim() === "" ? "text-red-600" : ""}`} data-testid="parsed-job-company">
                    {parsedJob.company || "⚠️ Not detected"}
                  </p>
                  {(!parsedJob.company || parsedJob.company.trim() === "") && (
                    <p className="text-xs text-red-600 mt-1">Required field missing</p>
                  )}
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm text-muted-foreground" data-testid="parsed-job-location">
                    {parsedJob.location || "Not specified"}
                  </p>
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <p className="text-sm text-muted-foreground" data-testid="parsed-job-type">
                    {parsedJob.employmentType || "Not specified"}
                  </p>
                </div>
              </div>
              
              {parsedJob.description && (
                <div>
                  <Label>Description (Preview)</Label>
                  <p className="text-sm text-muted-foreground" data-testid="parsed-job-description">
                    {parsedJob.description.substring(0, 200)}...
                  </p>
                </div>
              )}

              {(!parsedJob.title || parsedJob.title.trim() === "" || !parsedJob.company || parsedJob.company.trim() === "") && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Job title and company name are required. Please copy a more complete job posting, 
                    or manually add this application using the "New Application" button instead.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateApplication}
                  disabled={createApplicationMutation.isPending || !parsedJob.title || parsedJob.title.trim() === "" || !parsedJob.company || parsedJob.company.trim() === ""}
                  className="flex-1"
                  data-testid="button-create-application-from-linkedin"
                >
                  {createApplicationMutation.isPending ? "Creating..." : "Create Application"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setParsedJob(null)}
                  data-testid="button-cancel-parsed-job"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}