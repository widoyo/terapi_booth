import type { RequestHandler } from './$types';
import mqtt from 'mqtt';

const MQTT_URL = 'mqtt://mqtt.prinus.net:14983';

// Storage koneksi browser yang aktif
const subscribers = new Set<ReadableStreamDefaultController>();

function getMqttInstance() {
  console.log('[SSE] start getMqttInstance()');
  // @ts-ignore
  if (globalThis.mqttClient) {
    console.log('[MQTT] Membuka koneksi ke:', MQTT_URL);

    // @ts-ignore
    globalThis.mqttClient = mqtt.connect(MQTT_URL, {
      connectTimeout: 5000,
      reconnectPeriod: 5000,
      keepalive: 30,
      clientId: `web_server_${Math.random().toString(16).substring(2, 8)}`
    });

    // @ts-ignore
    globalThis.mqttClient.on('connect', () => {
      console.log('[MQTT] Terhubung! Subscribe ke pidibox/status');
      // @ts-ignore
      globalThis.mqttClient.subscribe('pidibox/status', (err: any) => {
        if (err) console.error('[MQTT] Gagal subscribe:', err);
      });
    });

    // @ts-ignore
    globalThis.mqttClient.on('error', (err: any) => {
      console.error('[MQTT Error]:', err?.message || err);
    });

    // @ts-ignore
    globalThis.mqttClient.on('message', (topic: string, message: Buffer) => {
      if (topic === 'pidibox/status') {
        const rawData = message.toString().trim();


        // Broadcast data ke semua tab browser
        for (const controller of subscribers) {
          try {
            // WAJIB \n\n di akhir pesan SSE
            controller.enqueue(`data: ${rawData}\n\n`);
          } catch {
            subscribers.delete(controller);
          }
        }
      }
    });
  } else {
    console.log('/api/device/stream: globalThis: ', globalThis);
  }
  // @ts-ignore
  return globalThis.mqttClient;
}

export const GET: RequestHandler = ({ request }) => {
  try {
    getMqttInstance();
    console.log('[SSE] getMqttInstance()');
  } catch (err) {
    console.error('[MQTT Init Error]:', err);
  }

  let currentController: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(controller) {
      currentController = controller;
      subscribers.add(controller);

      // Ping sambutan awal agar HTTP langsung 200 OK
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    },
    cancel() {
      if (currentController) {
        subscribers.delete(currentController);
      }
    }
  });

  request.signal.addEventListener('abort', () => {
    if (currentController) {
      subscribers.delete(currentController);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
};