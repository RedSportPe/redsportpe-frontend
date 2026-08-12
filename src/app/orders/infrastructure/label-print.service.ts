import { Injectable, signal } from '@angular/core';
import { LabelPrintItem } from '../domain/label-print-job.model';

const BRIDGE_URL = 'http://localhost:3001';

export interface PrintJobStatus {
  id: string;
  status: 'queued' | 'printing' | 'done' | 'error';
  total: number;
  printed: number;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class LabelPrintService {
  readonly currentJob = signal<PrintJobStatus | null>(null);
  readonly bridgeAvailable = signal<boolean | null>(null);

  /** Verifica bridge + impresora. Llamar al entrar a la pagina. */
  async checkBridge(): Promise<boolean> {
    try {
      const res = await fetch(`${BRIDGE_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const ok = data.printer?.reachable === true;
      this.bridgeAvailable.set(ok);
      return ok;
    } catch {
      this.bridgeAvailable.set(false);
      return false;
    }
  }

  /** Envia la cola al bridge y sigue el trabajo hasta que termina. */
  async printQueue(items: LabelPrintItem[]): Promise<PrintJobStatus | null> {
    const payload = {
      items: items.map((i) => ({
        sku: i.sku,
        line2: `${i.size} · ${i.color}`.toUpperCase(),
        quantity: i.quantity,
      })),
    };

    try {
      const res = await fetch(`${BRIDGE_URL}/print/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const { jobId } = await res.json();
      return await this.trackJob(jobId);
    } catch (err) {
      this.bridgeAvailable.set(false);
      console.warn('[LabelPrint] Bridge no disponible:', err);
      return null;
    }
  }

  private async trackJob(jobId: string, timeoutMs = 120_000): Promise<PrintJobStatus> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const res = await fetch(`${BRIDGE_URL}/jobs/${jobId}`);
      const job: PrintJobStatus = await res.json();
      this.currentJob.set(job);
      if (job.status === 'done' || job.status === 'error') return job;
      await new Promise((r) => setTimeout(r, 700));
    }
    throw new Error('El trabajo de impresion excedio el tiempo de espera');
  }
}
