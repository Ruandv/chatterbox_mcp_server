export class TimerService {
	private intervalId: NodeJS.Timeout | null = null;
	private intervalMs: number;
	private task: (() => void) | null = null;

	constructor(intervalMs: number, task?: () => void) {
		this.intervalMs = intervalMs;
		if (task) this.task = task;
	}

	setTask(task: () => void) {
		this.task = task;
	}

	setIntervalMs(intervalMs: number) {
		this.intervalMs = intervalMs;
		if (this.intervalId) {
			this.stop();
			this.start();
		}
	}

	start() {
		if (this.intervalId || !this.task) return;
		this.intervalId = setInterval(() => {
			try {
				this.task && this.task();
			} catch (err) {
				console.error('TimerService task error:', err);
			}
		}, this.intervalMs);
		console.log(`TimerService started with interval ${this.intervalMs}ms`);
	}

	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			console.log('TimerService stopped');
		}
	}
}
