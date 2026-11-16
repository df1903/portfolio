export interface TechUsageSource {
	label: string;
	technologyIds: string[];
}

export interface TechUsage {
	projects: string[];
	experience: string[];
}

/**
 * Cruce tecnología → dónde se usó (R13). Alimenta el explorador de tecnologías y el chat
 * ("¿tiene experiencia con X?").
 */
export function buildTechUsage(
	projects: TechUsageSource[],
	experience: TechUsageSource[],
): Map<string, TechUsage> {
	const usage = new Map<string, TechUsage>();
	const entryFor = (id: string): TechUsage => {
		let entry = usage.get(id);
		if (!entry) {
			entry = { projects: [], experience: [] };
			usage.set(id, entry);
		}
		return entry;
	};
	for (const project of projects) {
		for (const id of project.technologyIds) entryFor(id).projects.push(project.label);
	}
	for (const job of experience) {
		for (const id of job.technologyIds) entryFor(id).experience.push(job.label);
	}
	return usage;
}

export function usageCount(usage: TechUsage | undefined): number {
	return usage ? usage.projects.length + usage.experience.length : 0;
}
