
import { Report, Project, Unit, ProjectGroup } from '../types';
import { DEFAULT_PROJECTS, DEFAULT_UNITS } from '../constants';

const STORAGE_KEY = 'j1_action_plan_reports_v1';
const PROJECT_STORAGE_KEY = 'j1_action_plan_projects_v1';
const UNIT_STORAGE_KEY = 'j1_action_plan_units_v1';
const GROUP_STORAGE_KEY = 'j1_action_plan_groups_v1';

// Helper for safe parsing
const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    console.error(`Error parsing data for key ${key}:`, error);
    return fallback;
  }
};

// --- EXPORT / IMPORT ---

export const exportBackupData = () => {
  const data = {
    reports: getReports(),
    projects: getProjects(),
    units: getUnits(),
    groups: getProjectGroups(),
    timestamp: Date.now(),
    version: '1.0'
  };
  return JSON.stringify(data, null, 2);
};

export const importBackupData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    
    // Basic validation
    if (!data.reports || !data.projects || !data.units) {
      throw new Error("Invalid backup file format");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.reports));
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(data.projects));
    localStorage.setItem(UNIT_STORAGE_KEY, JSON.stringify(data.units));
    if (data.groups) {
        localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(data.groups));
    }
    
    return true;
  } catch (error) {
    console.error("Import failed:", error);
    return false;
  }
};

// Reports
export const getReports = (): Report[] => {
  return safeParse<Report[]>(STORAGE_KEY, []);
};

export const saveReport = (report: Report): void => {
  const reports = getReports();
  const existingIndex = reports.findIndex(r => r.id === report.id);
  
  if (existingIndex >= 0) {
    reports[existingIndex] = report;
  } else {
    reports.push(report);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

export const deleteReport = (id: string): void => {
  const reports = getReports();
  const filtered = reports.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getProjectLatestReport = (projectId: string): Report | undefined => {
  const reports = getReports();
  const projectReports = reports.filter(r => r.projectId === projectId);
  // Sort by date desc
  projectReports.sort((a, b) => new Date(b.reportDateEnd).getTime() - new Date(a.reportDateEnd).getTime());
  return projectReports[0];
};

// Projects
export const initializeProjects = () => {
  if (!localStorage.getItem(PROJECT_STORAGE_KEY)) {
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(DEFAULT_PROJECTS));
  }
};

export const getProjects = (): Project[] => {
  return safeParse<Project[]>(PROJECT_STORAGE_KEY, DEFAULT_PROJECTS);
};

export const saveProject = (project: Project): void => {
  const projects = getProjects();
  const existingIndex = projects.findIndex(p => p.id === project.id);

  if (existingIndex >= 0) {
    // Check if critical details (Name or Unit) changed, if so, sync with Reports
    const oldProject = projects[existingIndex];
    const nameChanged = oldProject.name !== project.name;
    const unitChanged = oldProject.unitId !== project.unitId;

    if (nameChanged || unitChanged) {
        const reports = getReports();
        let reportsUpdated = false;
        
        const updatedReports = reports.map(r => {
            if (r.projectId === project.id) {
                reportsUpdated = true;
                return {
                    ...r,
                    projectName: project.name, // Sync Name
                    unitId: project.unitId     // Sync Unit (Ownership)
                };
            }
            return r;
        });

        if (reportsUpdated) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));
        }
    }

    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }

  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
};

// Soft Delete (Move to Trash)
export const softDeleteProject = (id: string): void => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index >= 0) {
    // Create a safe copy before modifying
    const updatedProject = { ...projects[index], deletedAt: Date.now() };
    const newProjects = [...projects]; // Ensure new reference
    newProjects[index] = updatedProject;
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(newProjects));
  }
};

// Restore from Trash
export const restoreProject = (id: string): void => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index >= 0) {
    // Create a safe copy before modifying
    const updatedProject = { ...projects[index], deletedAt: undefined };
    const newProjects = [...projects]; // Ensure new reference
    newProjects[index] = updatedProject;
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(newProjects));
  }
};

// Permanent Delete
export const deleteProject = (id: string): void => {
  // 1. Delete the project permanently
  const projects = getProjects();
  const filteredProjects = projects.filter(p => p.id !== id);
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(filteredProjects));

  // 2. Cascade delete: Delete all reports associated with this project
  const reports = getReports();
  const filteredReports = reports.filter(r => r.projectId !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredReports));
};

// Cleanup Expired Trash (Run this on app start)
export const cleanupTrash = (): void => {
  const projects = getProjects();
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  
  // Identify projects to permanently delete
  const projectsToDelete: string[] = [];
  
  projects.forEach(p => {
    if (p.deletedAt && (now - p.deletedAt > THIRTY_DAYS_MS)) {
      projectsToDelete.push(p.id);
    }
  });

  if (projectsToDelete.length > 0) {
    // Remove expired projects
    const updatedProjects = projects.filter(p => !projectsToDelete.includes(p.id));
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(updatedProjects));

    // Cascade delete reports for expired projects
    const reports = getReports();
    const updatedReports = reports.filter(r => !projectsToDelete.includes(r.projectId));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));
  }
};

export const getAvailableYears = (): string[] => {
    const projects = getProjects();
    // Get unique years, sort descending (only from active projects)
    const activeProjects = projects.filter(p => !p.deletedAt);
    const years = Array.from(new Set(activeProjects.map(p => p.fiscalYear || "2569"))).sort((a, b) => b.localeCompare(a));
    // Ensure 2569 is always there if empty
    if(years.length === 0) return ["2569"];
    return years;
}

// Project Groups
export const getProjectGroups = (): ProjectGroup[] => {
  return safeParse<ProjectGroup[]>(GROUP_STORAGE_KEY, []);
};

export const saveProjectGroup = (group: ProjectGroup): void => {
  const groups = getProjectGroups();
  const existingIndex = groups.findIndex(g => g.id === group.id);

  if (existingIndex >= 0) {
    groups[existingIndex] = group;
  } else {
    groups.push(group);
  }
  localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groups));
};

export const deleteProjectGroup = (id: string): void => {
  // 1. Delete the group
  const groups = getProjectGroups();
  const filtered = groups.filter(g => g.id !== id);
  localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(filtered));

  // 2. Remove groupId from projects that were in this group
  const projects = getProjects();
  const updatedProjects = projects.map(p => {
    if (p.groupId === id) {
        return { ...p, groupId: undefined };
    }
    return p;
  });
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(updatedProjects));
};

// Units
export const getUnits = (): Unit[] => {
  const units = safeParse<Unit[] | null>(UNIT_STORAGE_KEY, null);
  
  if (units) {
    // Migration helper: ensure all units have password field (fallback to '123' if missing from old data)
    return units.map((u: Unit) => ({
        ...u,
        password: u.password || '123'
    }));
  }
  return DEFAULT_UNITS;
};

export const saveUnit = (unit: Unit): void => {
  const units = getUnits();
  const existingIndex = units.findIndex(u => u.id === unit.id);

  if (existingIndex >= 0) {
    units[existingIndex] = unit;
  } else {
    units.push(unit);
  }

  localStorage.setItem(UNIT_STORAGE_KEY, JSON.stringify(units));
};

export const deleteUnit = (id: string): void => {
  // 1. Delete the unit
  const units = getUnits();
  const filteredUnits = units.filter(u => u.id !== id);
  localStorage.setItem(UNIT_STORAGE_KEY, JSON.stringify(filteredUnits));

  // 2. Cascade delete: Delete all projects associated with this unit (Permanent Delete)
  const projects = getProjects();
  const unitProjectIds = projects.filter(p => p.unitId === id).map(p => p.id);
  const filteredProjects = projects.filter(p => p.unitId !== id);
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(filteredProjects));

  // 3. Cascade delete: Delete all reports associated with the deleted projects OR the unit directly
  const reports = getReports();
  const filteredReports = reports.filter(r => r.unitId !== id && !unitProjectIds.includes(r.projectId));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredReports));
};
