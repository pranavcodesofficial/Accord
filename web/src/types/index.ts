export interface Decision {
  id: string;
  workspace_id: string;
  user_id: string;
  decision_text: string;
  rationale: string | null;
  source_platform: string | null;
  source_link: string | null;
  is_superseded: boolean;
  supersedes_decision_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionHistory {
  current: Decision;
  supersedes: Decision | null;
  superseded_by: Decision[];
}

export interface DecisionListResponse {
  decisions: Decision[];
  total: number;
}

export interface CreateDecisionInput {
  decision_text: string;
  rationale?: string;
  source_platform?: string;
  source_link?: string;
}

export interface AuthState {
  token: string | null;
  workspace_id: string | null;
  user_id: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  workspace_id: string;
  user_id: string;
}
