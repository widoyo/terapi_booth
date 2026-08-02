import type { RequestHandler } from './$types';
import mqtt from 'mqtt';

const MQTT_URL = 'mqtt://mqtt.prinus.net:14983';

// Set penyimpanan subscriber stream SSE aktif
const subscribers = new Set<{ device_id: string; controller: ReadableStreamDefaultController }>();

// Instance MQTT client global (Singleton pattern aman HMR)
// @ts-ignore
if (!globalThis.mqttClient) {
    // @ts-ignore
    globalThis.mqttClient = mqtt.connect(MQTT_URL);
    
    // @ts-ignore
    globalThis.mqttClient.on('connect', () => {
        // @ts-ignore
        globalThis.mqttClient.subscribe('pidibox/status');
        console.log('[MQTT] Sukses terhubung dan subscribe ke pidibox/status');
    });

    // Tempelkan listener 'message' DI SINI (hanya sekali seumur hidup aplikasi)
    // @ts-ignore
    globalThis.mqttClient.on('message', (topic: string, message: Buffer) => {
        if (topic === 'pidibox/status') {
            try {
                const rawData = message.toString();
                const jsonPayload = JSON.parse(rawData);
                
                // Ambil ID perangkat dari properti .pidibox sesuai payload riil hardware
                const targetDevice = jsonPayload.pidibox;
                if (!targetDevice) return;

                // Distribusikan data hanya ke koneksi SSE yang meminta ID cocok
                for (const sub of subscribers) {
                    if (sub.device_id === targetDevice) {
                        try {
                            sub.controller.enqueue(`data: ${rawData}\n\n`);
                        } catch (e) {
                            subscribers.delete(sub);
                        }
                    }
                }
            } catch (e) {
                // Abaikan JSON corrupt
            }
        }
    });
}

export const GET: RequestHandler = ({ params }) => {
    const { device_id } = params;

    const stream = new ReadableStream({
        start(controller) {
            const currentSub = { device_id, controller };
            subscribers.add(currentSub);
        },
        cancel() {
            // Hapus subscriber dari memory saat tab browser ditutup atau koneksi putus
            for (const sub of subscribers) {
                if (sub.device_id === device_id) {
                    subscribers.delete(sub);
                    break;
                }
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    });
};