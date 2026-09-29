// The Locals the kit reads. A consuming app declares its own, and needs at least these fields for
// `requirePermission`, `recordAudit` and the CRUD factories to type-check against its events.
declare global {
	namespace App {
		interface Locals {
			user: { id: string } | null;
			permList: string[];
			isSuperAdmin: boolean;
			branch?: { active: number | null };
		}
		interface PageData {
			flash?: { type: 'success' | 'error'; message: string };
			permList?: string[];
		}
	}
}

export {};
