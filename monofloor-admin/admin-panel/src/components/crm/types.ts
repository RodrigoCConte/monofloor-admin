// Monofloor CRM - Shared Types

export interface Stage {
  id: string;
  name: string;
  color: string;
  probability?: number;
  groupName?: string;
  sortOrder?: number;
  isSystem?: boolean;
  isFinal?: boolean;
  isWon?: boolean;
}

export interface StageGroup {
  name: string;
  color: string;
  stages: Stage[];
}

export interface Consultant {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Followup {
  id: string;
  date: string;
  type: string;
  status: string;
}

export interface Deal {
  id: string;
  status: string;
  clientName?: string;
  value: number;
  leadScore?: number;
  consultant?: Consultant;
  nextFollowup?: Followup;
  daysInStage?: number;
  hasOverdueFollowup?: boolean;
  lastContact?: string;
  source?: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

export interface DealCardProps {
  deal: Deal;
  selected?: boolean;
  selectable?: boolean;
}

export interface PipelineColumnProps {
  stage: Stage;
  deals: Deal[];
  selectedDeals?: string[];
  selectable?: boolean;
  initialPageSize?: number;
  collapsed?: boolean;
}

export interface PipelineBoardProps {
  stages: Stage[];
  deals: Deal[];
  showGroups?: boolean;
  bulkMode?: boolean;
  selectedDeals?: string[];
}
