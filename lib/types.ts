export type Project = {
    id: string;
    name: string;
    reference: string | null;
    team_id: string;
    location_address: string | null;
    location_what3words: string | null;
};

export type ProjectListItem = {
    id: string;
    name: string;
    reference: string | null;
    last_edited_at: string;
};

export type RiskAssessmentListItem = {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
};

export type RiskAssessment = { 
    id: string; 
    name: string; 
    description: string | null; 
    project: { 
        id: string; 
        name: string; 
        team_id: string;
    } 
};

export type RaEntry = {
    id: number;
    task_description: string | null;
    hazard_id: string;
    hazard: { name: string; } | null;
    risk_id: string;
    risk: { name: string; } | null;
    person_affected: string | null;
    initial_likelihood: number;
    initial_impact: number;
    control_measures: string | null;
    resultant_likelihood: number;
    resultant_impact: number;
};

// UPDATED: This type now correctly uses first_name and last_name
export type TeamMember = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
};

export type Signatory = {
  user_id: string;
};

export type Signature = {
  user_id: string;
  signed_at: string;
};

// UPDATED: This type now also correctly uses first_name and last_name
export type DynamicRisk = {
    id: number;
    logged_at: string;
    risk_description: string;
    control_measures_taken: string;
    personnel_on_site: string | null;
    is_safe_to_continue: boolean;
    risk_status: string | null;
    logged_by: {
        first_name: string | null;
        last_name: string | null;
    } | null;
};