import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Filter } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ApplicationCard from "@/components/application-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ApplicationForm from "@/components/application-form";
import { JobApplication } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Applications() {
  const { toast } = useToast();
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: applications = [], isLoading } = useQuery<JobApplication[]>({
    queryKey: ["/api/applications"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this application?")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = searchQuery === "" || 
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Group applications by status
  const groupedApplications = {
    applied: filteredApplications.filter(app => app.status === "applied"),
    interview: filteredApplications.filter(app => app.status === "interview"),
    offer: filteredApplications.filter(app => app.status === "offer"),
    rejected: filteredApplications.filter(app => app.status === "rejected"),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Applications" 
            description="Manage all your job applications" 
          />
          <main className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Applications" 
          description="Manage all your job applications" 
        />

        <main className="flex-1 overflow-auto p-6">
          {/* Search and Filter */}
          <div className="bg-card rounded-lg border border-border shadow-sm mb-6">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">All Applications</h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search applications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-64"
                      data-testid="input-search-all-applications"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32" data-testid="select-status-filter-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-6">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No applications found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your search or filter criteria."
                      : "Get started by creating your first job application."
                    }
                  </p>
                  {searchQuery || statusFilter !== "all" ? (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                      data-testid="button-clear-filters"
                    >
                      Clear Filters
                    </Button>
                  ) : null}
                </div>
              ) : (
                <>
                  {/* Status Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{groupedApplications.applied.length}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Applied</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{groupedApplications.interview.length}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Interview</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                      <div className="text-2xl font-bold text-green-800 dark:text-green-200">{groupedApplications.offer.length}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Offers</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                      <div className="text-2xl font-bold text-red-800 dark:text-red-200">{groupedApplications.rejected.length}</div>
                      <div className="text-sm text-red-600 dark:text-red-400">Rejected</div>
                    </div>
                  </div>

                  {/* Applications List */}
                  <div className="space-y-4">
                    {filteredApplications.map((application) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        onEdit={setEditingApplication}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Edit Application Modal */}
      <Dialog open={!!editingApplication} onOpenChange={(open) => !open && setEditingApplication(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
          </DialogHeader>
          {editingApplication && (
            <ApplicationForm
              application={editingApplication}
              onClose={() => setEditingApplication(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
