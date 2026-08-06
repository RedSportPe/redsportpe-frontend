/** Shared scanner auto-detection (Caja + Consultar precio use the same trick):
 *  a USB barcode scanner "types" the whole code in a fast burst (<40ms/char).
 *  A human typing the same SKU by hand takes 150-300ms/char. Stateful per
 *  input box — call reset() when the box is cleared programmatically. */
export class ScanDetector {
  private startedAt = 0;
  private previousValue = '';

  constructor(private readonly msPerChar = 40) {}

  /** Call on every (input) event. Returns true when the burst that just
   *  finished looks like a scanner rather than manual typing. */
  observe(value: string): boolean {
    if (this.previousValue === '' && value !== '') {
      this.startedAt = Date.now();
    }
    this.previousValue = value;
    const elapsed = Date.now() - this.startedAt;
    return elapsed <= value.length * this.msPerChar;
  }

  reset(): void {
    this.previousValue = '';
    this.startedAt = 0;
  }
}
