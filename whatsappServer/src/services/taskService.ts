import { CronJob } from 'cron';

export class TaskService {
	private scheduledJobs: Map<string, CronJob> = new Map();

	constructor() {}

	scheduleTask(id: string, cronExpression: string, timeZone: string, callback: () => void) {
		// Stop existing job if present
		if (this.scheduledJobs.has(id)) {
			this.scheduledJobs.get(id)!.stop();
			this.scheduledJobs.delete(id);
		}
		// Schedule new job

		const job = new CronJob(
			cronExpression, // cronTime
			callback, // onTick
			null, // onComplete
			true, // start
			timeZone // timeZone
		);
		console.log(`Scheduled job ${id} with cron expression: ${cronExpression}`);
		this.scheduledJobs.set(id, job);
	}

	showScheduledTasks() {
		return Array.from(this.scheduledJobs.keys());
	}

	unscheduleTask(id: string) {
		if (this.scheduledJobs.has(id)) {
			this.scheduledJobs.get(id)!.stop();
			this.scheduledJobs.delete(id);
		}
	}
}
