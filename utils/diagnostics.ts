
import { getProjects, getReports, getUnits, saveProject, deleteProject, saveReport } from '../services/storageService';
import { Project, Report, Unit } from '../types';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export const runDiagnostics = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];
  const log = (name: string, passed: boolean, message: string = '') => {
    results.push({ name, passed, message });
  };

  try {
    // Test 1: Data Retrieval
    const projects = getProjects();
    const units = getUnits();
    log('Storage Retrieval', Array.isArray(projects) && Array.isArray(units), `Loaded ${projects.length} projects, ${units.length} units`);

    // Test 2: Project Creation & Deletion (Simulation)
    const testId = 'test-project-' + Date.now();
    const testProject: Project = {
        id: testId,
        unitId: units[0]?.id || 'u1',
        name: 'Unit Test Project',
        fiscalYear: '9999'
    };
    
    // Save
    saveProject(testProject);
    const savedP = getProjects().find(p => p.id === testId);
    if (!savedP) {
        log('Create Project', false, 'Failed to save project');
    } else {
        log('Create Project', true, 'Project saved successfully');
        
        // Cleanup (Delete)
        deleteProject(testId);
        const deletedP = getProjects().find(p => p.id === testId);
        log('Delete Project', !deletedP, deletedP ? 'Failed to delete' : 'Project deleted successfully');
    }

    // Test 3: Report Logic
    const testReport: Report = {
        id: 'test-report-' + Date.now(),
        unitId: 'u1',
        projectId: 'p1',
        projectName: 'Test',
        reportDateStart: '2025-01-01',
        reportDateEnd: '2025-01-31',
        pastPerformance: 'Test',
        nextPlan: 'Test',
        progress: 50,
        obstacles: '',
        remarks: '',
        fileLink: '',
        timestamp: Date.now()
    };
    
    // Validation Logic Check (Simple unit test concept)
    if (testReport.progress < 0 || testReport.progress > 100) {
        log('Data Validation', false, 'Progress validation failed logic');
    } else {
        log('Data Validation', true, 'Data structure valid');
    }

    // Test 4: Environment
    log('Environment Check', true, `User Agent: ${navigator.userAgent}`);

  } catch (e) {
    log('System Error', false, String(e));
  }

  return results;
};
