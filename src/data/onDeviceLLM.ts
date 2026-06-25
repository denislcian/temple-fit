// CAPA 1 · Datos — IA EN EL DISPOSITIVO (sin clave, sin servidor, 0€).
// Corre un LLM pequeño dentro del navegador con WebGPU (WebLLM/MLC). El modelo
// se descarga UNA vez (~1,6 GB) y queda cacheado; después funciona offline y
// nada sale del dispositivo. Es la opción "todo integrado, sin que nadie meta
// nada" que respeta el ADN de Temple. Se carga de forma perezosa (import
// dinámico) para no engordar el bundle inicial.
import type { MLCEngine } from '@mlc-ai/web-llm';

// Modelo por defecto: equilibrio calidad/tamaño para redactar un consejo corto.
// Apache-2.0. (Cambiar aquí si se quiere uno más pequeño para móviles modestos.)
export const ON_DEVICE_MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
export const ON_DEVICE_MODEL_LABEL = 'Qwen2.5 1.5B';
export const ON_DEVICE_DOWNLOAD_MB = 1600;

export interface DownloadProgress {
  /** 0..1 */
  progress: number;
  text: string;
}

/** ¿El dispositivo puede ejecutar el modelo local (WebGPU)? */
export async function isOnDeviceSupported(): Promise<boolean> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
  if (!gpu) return false;
  try {
    return !!(await gpu.requestAdapter());
  } catch {
    return false;
  }
}

let enginePromise: Promise<MLCEngine> | null = null;

/** true si el modelo ya está cargado en memoria (no habrá descarga/espera). */
export function isEngineReady(): boolean {
  return enginePromise !== null;
}

async function getEngine(onProgress?: (p: DownloadProgress) => void): Promise<MLCEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const webllm = await import('@mlc-ai/web-llm');
      return webllm.CreateMLCEngine(ON_DEVICE_MODEL, {
        initProgressCallback: (r) => onProgress?.({ progress: r.progress, text: r.text }),
      });
    })().catch((e) => {
      // No memorices un fallo: permite reintentar.
      enginePromise = null;
      throw e;
    });
  }
  return enginePromise;
}

/** Genera texto con el modelo local. La 1ª vez descarga (~1,6 GB) con progreso. */
export async function generateOnDevice(
  prompt: string,
  onProgress?: (p: DownloadProgress) => void,
): Promise<string> {
  let engine: MLCEngine;
  try {
    engine = await getEngine(onProgress);
  } catch {
    throw new Error('No se pudo cargar el modelo en el dispositivo. ¿Tu navegador soporta WebGPU?');
  }
  const reply = await engine.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
  });
  return reply.choices[0]?.message?.content ?? '';
}
