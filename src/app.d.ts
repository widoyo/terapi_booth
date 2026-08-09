// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { MqttClient } from 'mqtt';

declare global {
	namespace App {
		interface Locals {
			user?: {
				username: string;
				role: 'SUPER_ADMIN' | 'TENANT_ADMIN';
				tenantId?: number | null; // Tambahkan tenantId ke interface user
			};
		}
		interface Platform {
			env: {
				MQTT_BROKER: string;
				PIDIBOX_STATUS_TOPIC: string;
				PIDIBOX_CMD_TOPIC: string;
			}

		}
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
	}
	var mqttClient: MqttClient | undefined;
}

export { };
