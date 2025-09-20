import { useQuery } from "@tanstack/react-query";
import { FileText, Calendar, CheckCircle, PieChart, ArrowUp, ArrowRight, Search } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCard from "@/components/stats-card";
import ApplicationCard from "@/components/application-card";
import TimelineItem from "@/components/timeline-item";
import { DeadlineReminders } from "@/components/deadline-reminders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ApplicationForm from "@/components/application-form";
import { JobApplication } from "@shared/schema";
import { ApplicationStats, TimelineItem as TimelineItemType } from "@/lib/types";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stats } = useQuery<ApplicationStats>({
    queryKey: ["/api/stats"],
  });

  const { data: applications = [] } = useQuery<JobApplication[]>({
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

  // Recent applications (last 5)
  const recentApplications = filteredApplications.slice(0, 5);

  // Generate timeline items from applications
  const generateTimelineItems = (): TimelineItemType[] => {
    const items: TimelineItemType[] = [];
    
    applications.forEach(app => {
      if (app.status === "offer") {
        items.push({
          id: `${app.id}-offer`,
          type: "offer",
          title: `Offer received from ${app.company}`,
          description: app.position,
          timestamp: formatDistanceToNow(new Date(app.updatedAt)) + " ago",
          applicationId: app.id,
        });
      } else if (app.status === "interview") {
        items.push({
          id: `${app.id}-interview`,
          type: "interview",
          title: `Interview scheduled with ${app.company}`,
          description: app.position,
          timestamp: formatDistanceToNow(new Date(app.updatedAt)) + " ago",
          applicationId: app.id,
        });
      } else if (app.status === "rejected") {
        items.push({
          id: `${app.id}-rejection`,
          type: "rejection",
          title: `Application rejected by ${app.company}`,
          description: app.position,
          timestamp: formatDistanceToNow(new Date(app.updatedAt)) + " ago",
          applicationId: app.id,
        });
      } else {
        items.push({
          id: `${app.id}-application`,
          type: "application",
          title: `Application submitted to ${app.company}`,
          description: app.position,
          timestamp: formatDistanceToNow(new Date(app.applicationDate)) + " ago",
          applicationId: app.id,
        });
      }
    });

    return items.sort((a, b) => {
      // Sort by most recent first
      const aApp = applications.find(app => app.id === a.applicationId);
      const bApp = applications.find(app => app.id === b.applicationId);
      if (!aApp || !bApp) return 0;
      return new Date(bApp.updatedAt).getTime() - new Date(aApp.updatedAt).getTime();
    }).slice(0, 5);
  };

  const timelineItems = generateTimelineItems();

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard" 
          description="Track your job applications and progress" 
        />

        <main className="flex-1 overflow-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Applications"
              value={stats?.total || 0}
              icon={FileText}
              change="+12%"
              changeType="positive"
              iconBgColor="bg-blue-100 dark:bg-blue-900"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <StatsCard
              title="Interviews"
              value={stats?.interviews || 0}
              icon={Calendar}
              change="+3"
              changeType="positive"
              iconBgColor="bg-yellow-100 dark:bg-yellow-900"
              iconColor="text-yellow-600 dark:text-yellow-400"
            />
            <StatsCard
              title="Offers"
              value={stats?.offers || 0}
              icon={CheckCircle}
              change="+1"
              changeType="positive"
              iconBgColor="bg-green-100 dark:bg-green-900"
              iconColor="text-green-600 dark:text-green-400"
            />
            <StatsCard
              title="Response Rate"
              value={`${stats?.responseRate || 0}%`}
              icon={PieChart}
              change="+5%"
              changeType="positive"
              iconBgColor="bg-purple-100 dark:bg-purple-900"
              iconColor="text-purple-600 dark:text-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Applications */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Recent Applications</h3>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search applications..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-2 w-64"
                          data-testid="input-search-applications"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32" data-testid="select-status-filter">
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
                  {recentApplications.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mt-4 text-lg font-medium text-foreground">No applications found</h3>
                      <p className="mt-2 text-muted-foreground">
                        {searchQuery || statusFilter !== "all" 
                          ? "Try adjusting your search or filter criteria."
                          : "Get started by creating your first job application."
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentApplications.map((application) => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          onEdit={setEditingApplication}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                  
                  {applications.length > 5 && (
                    <div className="mt-6 text-center">
                      <Link href="/applications">
                        <Button variant="ghost" className="text-primary hover:text-primary/80" data-testid="link-view-all-applications">
                          View All Applications
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              {/* Application Timeline */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Application Timeline</h3>
                  <p className="text-muted-foreground text-sm">Recent activity and progress</p>
                </div>
                <div className="p-6">
                  {timelineItems.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {timelineItems.map((item) => (
                        <TimelineItem
                          key={item.id}
                          type={item.type}
                          title={item.title}
                          description={item.description}
                          timestamp={item.timestamp}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Deadline Reminders */}
              <DeadlineReminders />

              {/* Quick Actions */}
              <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
                </div>
                <div className="p-6 space-y-3">
                  <Dialog>
                    <Button className="w-full justify-center" data-testid="button-quick-add-application">
                      <FileText className="mr-2 h-4 w-4" />
                      Add New Application
                    </Button>
                  </Dialog>
                  <Button variant="outline" className="w-full justify-center" disabled data-testid="button-add-company">
                    <FileText className="mr-2 h-4 w-4" />
                    Add Company
                  </Button>
                  <Button variant="outline" className="w-full justify-center" disabled data-testid="button-export-data">
                    <FileText className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </div>
              </div>
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
