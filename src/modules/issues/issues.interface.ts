export type TIssueSort = "newest" | "oldest";
export type TIssueType = "bug" | "feature_request";
export type TIssueStatus = "open" | "in_progress" | "resolved";

export interface IIssuePayload {
  title: string;
  description: string;
  type: TIssueType;
}

export interface IIssueQueryParams {
  sort?: TIssueSort;
  type?: TIssueType;
  status?: TIssueStatus;
}

export interface IIssueRow {
  id: number;
  title: string;
  description: string;
  type: TIssueType;
  status: TIssueStatus;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface IReporter {
  id: number;
  name: string;
  role: string;
}

export type TIssue = {
  id?: number;
  title: string;
  description: string;
  type: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
  reporter_id: number;
  created_at?: Date;
  updated_at?: Date;
};
export interface IReporterMap {
  [key: number]: IReporter;
}
