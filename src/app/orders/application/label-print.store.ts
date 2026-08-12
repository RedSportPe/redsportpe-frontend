import {Injectable, signal, computed, inject} from '@angular/core';
import { LabelPrintItem } from '../domain/label-print-job.model';
import { LabelPrintService } from '../infrastructure/label-print.service';
@Injectable({ providedIn: 'root' })
export class LabelPrintStore {
  private _queue = signal<LabelPrintItem[]>([]);
  private readonly labelPrintService = inject(LabelPrintService);
  readonly queue = this._queue.asReadonly();
  readonly totalLabels = computed(() =>
    this._queue().reduce((sum, item) => sum + item.quantity, 0)
  );

  addToQueue(item: Omit<LabelPrintItem, 'quantity'>, quantity = 1): void {
    const items = [...this._queue()];
    const existing = items.find(i => i.sku === item.sku);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ ...item, quantity });
    }
    this._queue.set(items);
  }

  changeQuantity(sku: string, delta: number): void {
    this._queue.set(
      this._queue().map(i => i.sku === sku ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );
  }

  setQuantity(sku: string, quantity: number): void {
    this._queue.set(
      this._queue().map(i => i.sku === sku ? { ...i, quantity: Math.max(1, quantity) } : i)
    );
  }

  removeFromQueue(sku: string): void {
    this._queue.set(this._queue().filter(i => i.sku !== sku));
  }

  clearQueue(): void {
    this._queue.set([]);
  }
  /** Envia la cola al bridge local. */
  async sendToPrinter(): Promise<{ success: boolean; printed: number; error: string | null }> {
    const items = this._queue();
    if (items.length === 0) {
      return { success: false, printed: 0, error: 'La cola está vacía' };
    }

    const job = await this.labelPrintService.printQueue(items);

    if (!job) {
      return {
        success: false,
        printed: 0,
        error: 'El bridge de impresión no está disponible en esta PC',
      };
    }

    if (job.status === 'done') {
      this.clearQueue();
      return { success: true, printed: job.printed, error: null };
    }

    return { success: false, printed: job.printed, error: job.error };
  }

  /**
   * TODO: once the backend exists, POST each item as a print_job row.
   *  El bridge dejara de recibir peticiones directas y pasara a hacer polling
   *  cada 2 segundos: "hay print_jobs en estado pending para mi tienda?".
   *  Ventajas de ese cambio:
   *    - un solo bridge por tienda en vez de uno por PC
   *    - historial auditable de impresiones (quien, que SKU, cuando)
   *    - posibilidad de imprimir desde el celular
   *  La generacion de la etiqueta y el envio al puerto 9100 no cambian.
   */

}
