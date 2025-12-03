
export interface Unit {
  id: string;
  name: string;
  shortName: string;
  username: string;
  password?: string; // Added password field
}

export interface ProjectGroup {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  unitId: string;
  name: string;
  fiscalYear: string; 
  groupId?: string; // Added grouping
  deletedAt?: number; // Timestamp when moved to trash
}

export interface Report {
  id: string;
  unitId: string;
  projectId: string;
  projectName: string;
  reportDateStart: string;
  reportDateEnd: string;
  pastPerformance: string;
  nextPlan: string;
  progress: number; // 0-100
  obstacles: string;
  remarks: string;
  fileLink: string;
  timestamp: number;
}

export interface User {
  username: string;
  role: 'ADMIN' | 'USER';
  unitId?: string; // If ADMIN, this is undefined
}

export enum ReportStatus {
  NOT_STARTED = "ยังไม่เริ่ม",
  IN_PROGRESS = "อยู่ระหว่างดำเนินการ",
  COMPLETED = "เสร็จสิ้น"
}