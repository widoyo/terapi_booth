// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { MqttClient } from 'mqtt';

declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties
		}

		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
	}
	var mqttClient: MqttClient | undefined;
}

export {};
