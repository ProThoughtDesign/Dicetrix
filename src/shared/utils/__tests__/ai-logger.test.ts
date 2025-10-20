import { AILogger, ImpactTracker, AutomatedLoggingHooks, WorkflowMetrics } from '../ai-logger';

describe('AI Logging and Impact Tracking System', () => {
  beforeEach(() => {
    // Reset metrics before each test
    jest.clearAllMocks();
  });

  describe('ImpactTracker', () => {
    test('should track phase completion correctly', () => {
      const initialMetrics = ImpactTracker.getMetrics();
      const initialPhases = initialMetrics.phasesCompleted;

      ImpactTracker.trackPhaseCompletion('Test Phase');
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.phasesCompleted).toBe(initialPhases + 1);
      expect(updatedMetrics.iterationsPerPhase['Test Phase']).toBe(1);
    });

    test('should track multiple iterations of same phase', () => {
      ImpactTracker.trackPhaseCompletion('Repeated Phase');
      ImpactTracker.trackPhaseCompletion('Repeated Phase');
      
      const metrics = ImpactTracker.getMetrics();
      expect(metrics.iterationsPerPhase['Repeated Phase']).toBe(2);
    });

    test('should track decisions correctly', () => {
      const initialMetrics = ImpactTracker.getMetrics();
      const initialDecisions = initialMetrics.agentDecisions;

      ImpactTracker.trackDecision();
      ImpactTracker.trackDecision();
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.agentDecisions).toBe(initialDecisions + 2);
    });

    test('should track code generation events', () => {
      const initialMetrics = ImpactTracker.getMetrics();
      const initialEvents = initialMetrics.codeGenerationEvents;

      ImpactTracker.trackCodeGeneration();
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.codeGenerationEvents).toBe(initialEvents + 1);
    });

    test('should track error resolutions', () => {
      const initialMetrics = ImpactTracker.getMetrics();
      const initialErrors = initialMetrics.errorResolutions;

      ImpactTracker.trackErrorResolution();
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.errorResolutions).toBe(initialErrors + 1);
    });

    test('should add and track milestones', () => {
      const testMilestone = 'Test milestone achieved';
      ImpactTracker.addMilestone(testMilestone);
      
      const metrics = ImpactTracker.getMetrics();
      expect(metrics.milestones).toContain(expect.stringContaining(testMilestone));
    });

    test('should generate quantitative report with correct format', () => {
      ImpactTracker.trackPhaseCompletion('Report Test Phase');
      ImpactTracker.trackDecision();
      ImpactTracker.trackCodeGeneration();
      ImpactTracker.addMilestone('Report test milestone');
      
      const report = ImpactTracker.generateQuantitativeReport();
      
      expect(report).toContain('Quantitative Workflow Metrics');
      expect(report).toContain('Total Development Time');
      expect(report).toContain('Phases Completed');
      expect(report).toContain('Agent Decisions Made');
      expect(report).toContain('Code Generation Events');
      expect(report).toContain('Phase Breakdown');
      expect(report).toContain('Key Milestones');
      expect(report).toContain('Report test milestone');
    });

    test('should track total development time', () => {
      const metrics = ImpactTracker.getMetrics();
      expect(metrics.totalTime).toBeGreaterThan(0);
      expect(typeof metrics.totalTime).toBe('number');
    });
  });

  describe('AILogger', () => {
    test('should log decisions and update metrics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const initialMetrics = ImpactTracker.getMetrics();
      
      AILogger.logDecision('Test Phase', 'Test decision', 'Test rationale');
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.agentDecisions).toBe(initialMetrics.agentDecisions + 1);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test decision'));
      
      consoleSpy.mockRestore();
    });

    test('should log phase completion', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      AILogger.logPhaseComplete('Test Phase', 'Test summary');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test summary'));
      
      consoleSpy.mockRestore();
    });

    test('should log methodology', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      AILogger.logMethodology('Test Phase', 'Test methodology', 'Test context');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test methodology'));
      
      consoleSpy.mockRestore();
    });

    test('should log code generation and update metrics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const initialMetrics = ImpactTracker.getMetrics();
      
      AILogger.logCodeGeneration('Test Phase', 'Test code generation');
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.codeGenerationEvents).toBe(initialMetrics.codeGenerationEvents + 1);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Code Generation: Test code generation'));
      
      consoleSpy.mockRestore();
    });

    test('should log errors and update metrics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const initialMetrics = ImpactTracker.getMetrics();
      
      AILogger.logError('Test Phase', 'Test error', 'Test resolution');
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.errorResolutions).toBe(initialMetrics.errorResolutions + 1);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
      
      consoleSpy.mockRestore();
    });

    test('should log milestones and update tracker', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const initialMetrics = ImpactTracker.getMetrics();
      
      AILogger.logMilestone('Test Phase', 'Test milestone');
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.milestones.length).toBe(initialMetrics.milestones.length + 1);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test milestone'));
      
      consoleSpy.mockRestore();
    });

    test('should generate comprehensive impact report', () => {
      // Add some test data
      ImpactTracker.trackPhaseCompletion('Report Test');
      ImpactTracker.trackDecision();
      ImpactTracker.trackCodeGeneration();
      ImpactTracker.addMilestone('Test milestone for report');
      
      const report = AILogger.generateImpactReport();
      
      expect(report).toContain('Kiro Workflow Impact Report - Dicetrix');
      expect(report).toContain('Quantitative Workflow Metrics');
      expect(report).toContain('Workflow Impact Analysis');
      expect(report).toContain('Agent Roles and Methodologies');
      expect(report).toContain('Technical Achievements');
      expect(report).toContain('Platform Integration');
      expect(report).toContain('Total Development Efficiency');
      expect(report).toContain('Test milestone for report');
    });
  });

  describe('AutomatedLoggingHooks', () => {
    test('should log task start correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const initialMetrics = ImpactTracker.getMetrics();
      
      AutomatedLoggingHooks.onTaskStart(99, 'Test Task');
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.agentDecisions).toBe(initialMetrics.agentDecisions + 1);
      expect(updatedMetrics.milestones).toContain(expect.stringContaining('Task 99 started: Test Task'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Starting Test Task'));
      
      consoleSpy.mockRestore();
    });

    test('should log file creation', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const initialMetrics = ImpactTracker.getMetrics();
      
      AutomatedLoggingHooks.onFileCreated(99, 'test-file.ts', 'Test purpose');
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.codeGenerationEvents).toBe(initialMetrics.codeGenerationEvents + 1);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Created test-file.ts - Test purpose'));
      
      consoleSpy.mockRestore();
    });

    test('should log file modification', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const initialMetrics = ImpactTracker.getMetrics();
      
      AutomatedLoggingHooks.onFileModified(99, 'test-file.ts', 'Test changes');
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.codeGenerationEvents).toBe(initialMetrics.codeGenerationEvents + 1);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Modified test-file.ts - Test changes'));
      
      consoleSpy.mockRestore();
    });

    test('should log task completion with phase tracking', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const initialMetrics = ImpactTracker.getMetrics();
      
      AutomatedLoggingHooks.onTaskComplete(
        99, 
        'Test Task', 
        'Test summary', 
        ['file1.ts', 'file2.ts'], 
        ['req1', 'req2']
      );
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.phasesCompleted).toBe(initialMetrics.phasesCompleted + 1);
      expect(updatedMetrics.milestones).toContain(expect.stringContaining('Task 99 completed: Test Task'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Task completed'));
      
      consoleSpy.mockRestore();
    });

    test('should log milestones reached', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const initialMetrics = ImpactTracker.getMetrics();
      
      AutomatedLoggingHooks.onMilestoneReached('Test Phase', 'Test Milestone', 'Test significance');
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.milestones).toContain(expect.stringContaining('Test Phase: Test Milestone'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Milestone - Test significance'));
      
      consoleSpy.mockRestore();
    });

    test('should generate automated diary entries', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      AutomatedLoggingHooks.generateAutomatedDiaryEntry('Test Phase', 'Test context');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Automated Entry'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test context'));
      
      consoleSpy.mockRestore();
    });

    test('should handle error logging', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const initialMetrics = ImpactTracker.getMetrics();
      
      AutomatedLoggingHooks.onErrorEncountered(99, 'Test error', 'Test resolution');
      
      const updatedMetrics = ImpactTracker.getMetrics();
      expect(updatedMetrics.errorResolutions).toBe(initialMetrics.errorResolutions + 1);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    test('should maintain consistent metrics across all logging methods', () => {
      const initialMetrics = ImpactTracker.getMetrics();
      
      // Simulate a complete task workflow
      AutomatedLoggingHooks.onTaskStart(100, 'Integration Test Task');
      AutomatedLoggingHooks.onFileCreated(100, 'integration-test.ts', 'Integration testing');
      AutomatedLoggingHooks.onFileModified(100, 'existing-file.ts', 'Integration updates');
      AutomatedLoggingHooks.onMilestoneReached('Task 100', 'Integration Complete', 'All systems integrated');
      AutomatedLoggingHooks.onTaskComplete(100, 'Integration Test Task', 'Integration successful', ['integration-test.ts'], ['integration-req']);
      
      const finalMetrics = ImpactTracker.getMetrics();
      
      // Verify all metrics were updated correctly
      expect(finalMetrics.phasesCompleted).toBe(initialMetrics.phasesCompleted + 1);
      expect(finalMetrics.agentDecisions).toBe(initialMetrics.agentDecisions + 1);
      expect(finalMetrics.codeGenerationEvents).toBe(initialMetrics.codeGenerationEvents + 2);
      expect(finalMetrics.milestones.length).toBeGreaterThan(initialMetrics.milestones.length);
    });

    test('should generate comprehensive reports with real data', () => {
      // Add comprehensive test data
      AutomatedLoggingHooks.onTaskStart(101, 'Report Generation Test');
      AutomatedLoggingHooks.onFileCreated(101, 'report-test.ts', 'Report testing');
      AutomatedLoggingHooks.onErrorEncountered(101, 'Test error for report', 'Successfully resolved');
      AutomatedLoggingHooks.onTaskComplete(101, 'Report Generation Test', 'Report test complete', ['report-test.ts'], ['report-req']);
      
      const report = AILogger.generateImpactReport();
      const quantitativeReport = ImpactTracker.generateQuantitativeReport();
      
      // Verify both reports contain expected data
      expect(report).toContain('Report Generation Test');
      expect(quantitativeReport).toContain('Report Generation Test');
      expect(report).toContain('Total Development Efficiency');
      expect(quantitativeReport).toContain('Phase Breakdown');
    });
  });
});
