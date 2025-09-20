export interface ApplicationStats {
  total: number;
  interviews: number;
  offers: number;
  rejected: number;
  responseRate: number;
}

export interface TimelineItem {
  id: string;
  type: 'offer' | 'interview' | 'application' | 'rejection' | 'update';
  title: string;
  description: string;
  timestamp: string;
  applicationId?: string;
}
