import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogStore } from '../../../application/catalog.store';
import { GarmentTypesStore } from '../../../application/garment-types.store';
import { ColorsStore } from '../../../application/colors.store';
import { Variant } from '../../../domain/product.model';
import { buildSku, isValidSku, sizesForGender, BRAND_CODES } from '../../../domain/sku.value-object';
import { AgentsStore } from '../../../../identity/application/agents.store';
import { splitProductCode } from '../../../domain/garment-type.model';
import { sizeLabel } from '../../../domain/product-filtering';
import { UnsavedChangesAware } from '../../../../layout/unsaved-changes.guard';

/** One editable variant row; the SKU derives from code + gender + size + color */
interface VariantRow {
  gender: Variant['gender'];
  size: string;
  color: string;
  stock: number;
}

const VARIANT_GENDERS: [Variant['gender'], string][] = [
  ['H', 'Hombre'],
  ['M', 'Mujer'],
  ['U', 'Unisex adulto'],
  ['NO', 'Niño'],
  ['NA', 'Niña'],
];

@Component({
  selector: 'app-admin-product-form-page',
  imports: [RouterLink],
  templateUrl: './admin-product-form-page.html',
  styleUrl: './admin-product-form-page.scss',
})
export class AdminProductFormPage implements OnInit, UnsavedChangesAware {
  readonly store = inject(CatalogStore);
  readonly garmentTypesStore = inject(GarmentTypesStore);
  readonly colorsStore = inject(ColorsStore);
  readonly agentsStore = inject(AgentsStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** Blocked-exit feedback: the form shakes and the buttons pulse */
  readonly blocked = signal(false);
  private baseline = '';
  private leaving = false;

  readonly genderOptions = VARIANT_GENDERS;
  readonly brandOptions = Object.entries(BRAND_CODES);
  /** Tiendas come from the admin's Agentes Comerciales registry (T1…TN) */
  readonly storeOptions = this.agentsStore.agents;
  readonly colorOptions = this.colorsStore.colors;
  readonly sizeLabel = sizeLabel;
  readonly sizesForGender = sizesForGender;
  readonly garmentTypes = this.garmentTypesStore.types;

  readonly editingId = signal<string | null>(null);
  readonly notFound = signal(false);

  // Form state
  readonly name = signal('');
  readonly description = signal('');
  readonly category = signal('');
  readonly price = signal(0);
  /** Gallery: data URLs read from the admin's uploaded files. The FIRST one
   *  is the cover shown on cards/cart. Real file storage comes with the backend. */
  readonly images = signal<string[]>([]);
  /** SKU brand prefix: RS (RedSport), AD (Adidas), NK (Nike) */
  readonly brand = signal('RS');
  /** SKU store suffix: which tienda holds this stock (T1 = Tienda 1) */
  readonly storeCode = signal('T1');
  /** SKU code = garmentType (e.g. 'CJ') + modelCode (e.g. 'TP') = 'CJTP' */
  readonly garmentType = signal('');
  readonly modelCode = signal('');
  readonly productCode = computed(() => `${this.garmentType()}${this.modelCode()}`.toUpperCase());
  /** Legacy codes that don't start with a known type code — shown as a hint, not blocking */
  readonly unresolvedLegacyCode = signal(false);

  // "+ Agregar tipo nuevo" inline mini-form
  readonly addingType = signal(false);
  readonly newTypeCode = signal('');
  readonly newTypeLabel = signal('');
  readonly newTypeError = signal<string | null>(null);

  // "+ Agregar color nuevo" inline mini-form (opened from a variant row's select)
  readonly addingColorForRow = signal<number | null>(null);
  readonly newColorCode = signal('');
  readonly newColorLabel = signal('');
  readonly newColorError = signal<string | null>(null);

  readonly published = signal(true);
  readonly featured = signal(false);
  readonly variants = signal<VariantRow[]>([
    { gender: 'U', size: 'M', color: 'NEG', stock: 0 },
  ]);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.store.loadCatalog();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.baseline = this.snapshot();
      return;
    }

    const product = this.store.allProducts().find(p => p.id === id);
    if (!product) {
      // Catalog may still be loading over HTTP on a fresh entry: try again shortly
      setTimeout(() => this.loadForEdit(id), 400);
      return;
    }
    this.fillForm(id);
  }

  // ===== Unsaved-changes contract (blocks leaving mid-edit) =====

  /** Serialized form state — dirty means it differs from the baseline */
  private snapshot(): string {
    return JSON.stringify({
      name: this.name(),
      description: this.description(),
      category: this.category(),
      price: this.price(),
      images: this.images(),
      brand: this.brand(),
      storeCode: this.storeCode(),
      code: this.productCode(),
      published: this.published(),
      featured: this.featured(),
      variants: this.variants(),
    });
  }

  hasUnsavedChanges(): boolean {
    return !this.leaving && !this.notFound() && this.snapshot() !== this.baseline;
  }

  notifyBlockedNavigation(): void {
    if (this.blocked()) return; // let the current animation finish
    this.blocked.set(true);
    setTimeout(() => this.blocked.set(false), 1200);
  }

  /** The explicit way out: cancelling discards the changes on purpose */
  cancel(): void {
    this.leaving = true;
    this.router.navigate(['/admin/productos']);
  }

  private loadForEdit(id: string): void {
    if (this.store.allProducts().some(p => p.id === id)) {
      this.fillForm(id);
    } else {
      this.notFound.set(true);
    }
  }

  private fillForm(id: string): void {
    const product = this.store.allProducts().find(p => p.id === id)!;
    this.editingId.set(id);
    this.name.set(product.name);
    this.description.set(product.description);
    this.category.set(product.category);
    this.price.set(product.price);
    this.images.set(
      product.images?.length ? [...product.images] : (product.imageUrl ? [product.imageUrl] : [])
    );
    this.published.set(product.published);
    this.featured.set(product.featured);
    // SKU segments: [BRAND]-[CODE]-[GENDER]-[SIZE]-[COLOR]-[STORE]
    const segments = product.variants[0]?.sku.split('-') ?? [];
    this.brand.set(segments[0] || 'RS');
    this.storeCode.set(segments[5] || 'T1');
    const fullCode = segments[1] ?? '';
    const split = splitProductCode(fullCode, this.garmentTypes());
    if (split) {
      this.garmentType.set(split.typeCode);
      this.modelCode.set(split.modelCode);
      this.unresolvedLegacyCode.set(false);
    } else {
      // Older/manual code that doesn't start with a known type — keep it
      // editable as the "model" part so nothing breaks, just flag it.
      this.garmentType.set('');
      this.modelCode.set(fullCode);
      this.unresolvedLegacyCode.set(fullCode.length > 0);
    }
    this.variants.set(
      product.variants.map(v => ({
        gender: v.gender,
        size: v.size,
        color: v.color,
        stock: v.totalStock,
      }))
    );
    this.baseline = this.snapshot();
  }

  /** Live SKU preview per row ('—' while the parts are incomplete/invalid) */
  skuFor(row: VariantRow): string {
    try {
      return buildSku(this.brand(), this.productCode(), row.gender, row.size, row.color, this.storeCode());
    } catch {
      return '—';
    }
  }

  readonly canSave = computed(() => {
    if (!this.name().trim() || !this.category().trim() || this.price() <= 0) return false;
    if (!this.garmentType().trim() && !this.unresolvedLegacyCode()) return false;
    if (!/^[A-Za-z0-9]{2,6}$/.test(this.productCode())) return false;
    const rows = this.variants();
    if (rows.length === 0 || rows.some(r => r.stock < 0)) return false;
    const skus = rows.map(r =>
      `${this.brand()}-${this.productCode()}-${r.gender}-${r.size}-${r.color}-${this.storeCode()}`.toUpperCase()
    );
    return skus.every(sku => isValidSku(sku)) && new Set(skus).size === skus.length;
  });

  onText(field: 'name' | 'description' | 'category' | 'modelCode', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
  }

  onBrandChange(event: Event): void {
    this.brand.set((event.target as HTMLSelectElement).value);
  }

  onStoreChange(event: Event): void {
    this.storeCode.set((event.target as HTMLSelectElement).value);
  }

  onGarmentTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === '__new__') {
      this.addingType.set(true);
      return;
    }
    this.garmentType.set(value);
    this.unresolvedLegacyCode.set(false);
  }

  onNewTypeCode(event: Event): void {
    this.newTypeCode.set((event.target as HTMLInputElement).value);
  }

  onNewTypeLabel(event: Event): void {
    this.newTypeLabel.set((event.target as HTMLInputElement).value);
  }

  confirmNewType(): void {
    const err = this.garmentTypesStore.addType(this.newTypeCode(), this.newTypeLabel());
    if (err) {
      this.newTypeError.set(err);
      return;
    }
    this.garmentType.set(this.newTypeCode().trim().toUpperCase());
    this.unresolvedLegacyCode.set(false);
    this.cancelNewType();
  }

  cancelNewType(): void {
    this.addingType.set(false);
    this.newTypeCode.set('');
    this.newTypeLabel.set('');
    this.newTypeError.set(null);
  }

  /** Reads every selected file as a data URL and appends it to the gallery */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    for (const file of Array.from(input.files ?? [])) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        this.images.update(list => [...list, dataUrl]);
      };
      reader.readAsDataURL(file);
    }
    input.value = ''; // allow re-selecting the same file
  }

  removeImage(index: number): void {
    this.images.update(list => list.filter((_, i) => i !== index));
  }

  /** The clicked image becomes the cover (first position) */
  makeCover(index: number): void {
    this.images.update(list => {
      if (index === 0) return list;
      const next = [...list];
      const [img] = next.splice(index, 1);
      next.unshift(img);
      return next;
    });
  }

  onPrice(event: Event): void {
    this.price.set(Number((event.target as HTMLInputElement).value) || 0);
  }

  updateRow(index: number, field: keyof VariantRow, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;

    // The color select has a "+ Agregar color nuevo…" entry
    if (field === 'color' && value === '__new__') {
      this.addingColorForRow.set(index);
      return;
    }

    this.variants.update(rows =>
      rows.map((row, i) => {
        if (i !== index) return row;
        const next = {
          ...row,
          [field]: field === 'stock' ? Math.max(0, Number(value) || 0) : value,
        };
        // Business rule: kids (NO/NA) wear even 4-16, adults wear S-XXL —
        // switching gender snaps the size into the right table
        if (field === 'gender' && !sizesForGender(next.gender).includes(next.size)) {
          next.size = sizesForGender(next.gender)[0];
        }
        return next;
      })
    );
  }

  onNewColorCode(event: Event): void {
    this.newColorCode.set((event.target as HTMLInputElement).value);
  }

  onNewColorLabel(event: Event): void {
    this.newColorLabel.set((event.target as HTMLInputElement).value);
  }

  confirmNewColor(): void {
    const row = this.addingColorForRow();
    const err = this.colorsStore.addColor(this.newColorCode(), this.newColorLabel());
    if (err) {
      this.newColorError.set(err);
      return;
    }
    const code = this.newColorCode().trim().toUpperCase();
    if (row !== null) {
      this.variants.update(rows =>
        rows.map((r, i) => (i === row ? { ...r, color: code } : r))
      );
    }
    this.cancelNewColor();
  }

  cancelNewColor(): void {
    this.addingColorForRow.set(null);
    this.newColorCode.set('');
    this.newColorLabel.set('');
    this.newColorError.set(null);
  }

  addRow(): void {
    this.variants.update(rows => [...rows, { gender: 'U', size: 'M', color: 'NEG', stock: 0 }]);
  }

  removeRow(index: number): void {
    this.variants.update(rows => rows.filter((_, i) => i !== index));
  }

  save(): void {
    if (!this.canSave()) return;

    let builtVariants: Variant[];
    try {
      builtVariants = this.variants().map(row => ({
        sku: buildSku(this.brand(), this.productCode(), row.gender, row.size, row.color, this.storeCode()),
        gender: row.gender,
        size: row.size,
        color: row.color,
        totalStock: row.stock,
      }));
    } catch (e) {
      this.error.set((e as Error).message);
      return;
    }

    const gallery = this.images();
    const data = {
      name: this.name().trim(),
      description: this.description().trim(),
      category: this.category().trim(),
      price: this.price(),
      imageUrl: gallery[0] ?? '/images/products/placeholder.jpg',
      images: gallery,
      published: this.published(),
      featured: this.featured(),
      variants: builtVariants,
    };

    const id = this.editingId();
    if (id) {
      this.store.updateProduct(id, data);
    } else {
      this.store.createProduct(data);
    }
    this.leaving = true;   // saved: the guard lets us out
    this.router.navigate(['/admin/productos']);
  }
}
