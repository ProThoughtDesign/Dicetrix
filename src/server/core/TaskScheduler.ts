import { scheduler } from '@devvit/web/server';
import Logger from '../utils/Logger';

export interface TaskScheduler {
  scheduleTask(taskId: string, executeAt: number, callback: () => Promise<void>): Promise<void>;
  cancelTask(taskId: string): Promise<void>;
  isTaskScheduled(taskId: string): Promise<boolean>;
}

/**
 * DevvitTaskScheduler implements TaskScheduler using Devvit's built-in scheduler
 * Provides automated task scheduling for leaderboard resets and other operations
 */
export class DevvitTaskScheduler implements TaskScheduler {
  private scheduledTasks: Map<string, string> = new Map(); // taskId -> jobId mapping

  /**
   * Schedule a task to run at a specific time
   * @param taskId Unique identifier for the task
   * @param executeAt Timestamp when the task should execute
   * @param _callback Function to execute when the task runs (handled by Devvit scheduler)
   */
  async scheduleTask(taskId: string, executeAt: number, _callback: () => Promise<void>): Promise<void> {
    try {
      Logger.log(`TaskScheduler: Scheduling task ${taskId} for ${new Date(executeAt).toISOString()}`);

      // Cancel existing task if it exists
      await this.cancelTask(taskId);

      // Schedule new job using Devvit scheduler
      const jobId = await scheduler.runJob({
        name: 'leaderboard_reset',
        data: { taskId },
        runAt: new Date(executeAt)
      });

      // Store the mapping
      this.scheduledTasks.set(taskId, jobId);

      Logger.log(`TaskScheduler: Task ${taskId} scheduled with job ID ${jobId}`);
    } catch (error) {
      Logger.log(`TaskScheduler: Error scheduling task ${taskId}: ${String(error)}`);
      throw new Error(`Failed to schedule task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel a scheduled task
   * @param taskId Unique identifier for the task to cancel
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      const jobId = this.scheduledTasks.get(taskId);
      
      if (jobId) {
        Logger.log(`TaskScheduler: Cancelling task ${taskId} with job ID ${jobId}`);
        
        await scheduler.cancelJob(jobId);
        this.scheduledTasks.delete(taskId);
        
        Logger.log(`TaskScheduler: Task ${taskId} cancelled successfully`);
      } else {
        Logger.log(`TaskScheduler: No scheduled task found for ${taskId}`);
      }
    } catch (error) {
      Logger.log(`TaskScheduler: Error cancelling task ${taskId}: ${String(error)}`);
      // Don't throw error for cancellation failures - task might already be completed
    }
  }

  /**
   * Check if a task is currently scheduled
   * @param taskId Unique identifier for the task
   * @returns True if the task is scheduled, false otherwise
   */
  async isTaskScheduled(taskId: string): Promise<boolean> {
    try {
      const jobId = this.scheduledTasks.get(taskId);
      
      if (!jobId) {
        return false;
      }

      // Check if the job still exists in the scheduler
      const allJobs = await scheduler.listJobs();
      const jobExists = allJobs.some(job => job.id === jobId);

      if (!jobExists) {
        // Clean up our mapping if the job no longer exists
        this.scheduledTasks.delete(taskId);
        return false;
      }

      return true;
    } catch (error) {
      Logger.log(`TaskScheduler: Error checking task status for ${taskId}: ${String(error)}`);
      return false;
    }
  }

  /**
   * Get all currently scheduled tasks
   * @returns Array of task IDs that are currently scheduled
   */
  async getScheduledTasks(): Promise<string[]> {
    try {
      const allJobs = await scheduler.listJobs();
      const validTaskIds: string[] = [];

      // Clean up our mapping and return valid task IDs
      for (const [taskId, jobId] of this.scheduledTasks.entries()) {
        const jobExists = allJobs.some(job => job.id === jobId);
        
        if (jobExists) {
          validTaskIds.push(taskId);
        } else {
          // Clean up stale mapping
          this.scheduledTasks.delete(taskId);
        }
      }

      return validTaskIds;
    } catch (error) {
      Logger.log(`TaskScheduler: Error getting scheduled tasks: ${String(error)}`);
      return [];
    }
  }

  /**
   * Get details about a scheduled task
   * @param taskId Unique identifier for the task
   * @returns Task details or null if not found
   */
  async getTaskDetails(taskId: string): Promise<{ jobId: string; runAt: Date; name: string } | null> {
    try {
      const jobId = this.scheduledTasks.get(taskId);
      
      if (!jobId) {
        return null;
      }

      const allJobs = await scheduler.listJobs();
      const job = allJobs.find(j => j.id === jobId);

      if (!job) {
        // Clean up stale mapping
        this.scheduledTasks.delete(taskId);
        return null;
      }

      return {
        jobId: job.id,
        runAt: 'runAt' in job ? job.runAt : new Date(), // Handle both ScheduledJob and ScheduledCronJob
        name: job.name
      };
    } catch (error) {
      Logger.log(`TaskScheduler: Error getting task details for ${taskId}: ${String(error)}`);
      return null;
    }
  }
}
