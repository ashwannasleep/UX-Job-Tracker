import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, User, ExternalLink } from "lucide-react";
import { SiLinkedin } from "react-icons/si";
import ApplicationForm from "../application-form";
import LinkedInImport from "../linkedin-import";

interface HeaderProps {
  title: string;
  description: string;
}

export default function Header({ title, description }: HeaderProps) {
  const [linkedInImportOpen, setLinkedInImportOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setLinkedInImportOpen(true)}
            className="flex items-center"
            data-testid="button-linkedin-import"
          >
            <SiLinkedin className="mr-2 h-4 w-4 text-blue-600" />
            LinkedIn Import
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button data-testid="button-new-application">
                <Plus className="mr-2 h-4 w-4" />
                New Application
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Application</DialogTitle>
              </DialogHeader>
              <ApplicationForm />
            </DialogContent>
          </Dialog>
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <LinkedInImport 
        isOpen={linkedInImportOpen} 
        onClose={() => setLinkedInImportOpen(false)} 
      />
    </header>
  );
}
