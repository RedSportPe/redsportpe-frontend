import { Injectable, signal } from '@angular/core';
import { COLOR_LABELS, registerColor } from '../domain/product-filtering';

export interface ColorOption {
  code: string;   // 3 uppercase letters, e.g. 'JAD'
  label: string;  // e.g. 'Jade'
}

const COLOR_CODE_PATTERN = /^[A-Z]{3}$/;

/** In-memory for now (resets on reload) — same pattern as GarmentTypesStore.
 *  The admin can add colors (JAD = Jade) from the product form; registerColor
 *  keeps colorLabel() working app-wide for the new codes. */
@Injectable({ providedIn: 'root' })
export class ColorsStore {
  private _colors = signal<ColorOption[]>(
    Object.entries(COLOR_LABELS).map(([code, label]) => ({ code, label }))
  );
  readonly colors = this._colors.asReadonly();

  /** Returns null on success, or an error message to show the admin */
  addColor(code: string, label: string): string | null {
    const normalizedCode = code.trim().toUpperCase();
    const normalizedLabel = label.trim();

    if (!COLOR_CODE_PATTERN.test(normalizedCode)) {
      return 'La abreviatura debe tener exactamente 3 letras (ej: JAD).';
    }
    if (!normalizedLabel) {
      return 'Escribe el nombre del color.';
    }
    if (this._colors().some(c => c.code === normalizedCode)) {
      return `La abreviatura "${normalizedCode}" ya existe.`;
    }

    registerColor(normalizedCode, normalizedLabel);
    this._colors.update(list => [...list, { code: normalizedCode, label: normalizedLabel }]);
    return null;
  }
}
