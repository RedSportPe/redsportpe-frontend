import { Injectable, signal } from '@angular/core';
import { GarmentType, DEFAULT_GARMENT_TYPES, isValidGarmentTypeCode } from '../domain/garment-type.model';

/** In-memory for now (resets on reload) — same mock-persistence pattern as
 *  CatalogStore, ready to swap for a real API later. Any admin can extend
 *  this list from the product form; there's no fixed hardcoded ceiling. */
@Injectable({ providedIn: 'root' })
export class GarmentTypesStore {
  private _types = signal<GarmentType[]>(DEFAULT_GARMENT_TYPES);
  readonly types = this._types.asReadonly();

  /** Returns null on success, or an error message to show the admin */
  addType(code: string, label: string): string | null {
    const normalizedCode = code.trim().toUpperCase();
    const normalizedLabel = label.trim();

    if (!isValidGarmentTypeCode(normalizedCode)) {
      return 'El código debe tener de 1 a 3 letras (ej: CJ).';
    }
    if (!normalizedLabel) {
      return 'Escribe un nombre para el tipo de prenda.';
    }
    if (this._types().some(t => t.code === normalizedCode)) {
      return `El código "${normalizedCode}" ya existe.`;
    }

    this._types.update(list => [...list, { code: normalizedCode, label: normalizedLabel }]);
    return null;
  }
}
