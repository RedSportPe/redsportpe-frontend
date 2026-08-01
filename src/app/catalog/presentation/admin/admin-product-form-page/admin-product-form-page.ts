import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogStore } from '../../../application/catalog.store';
import { Variant } from '../../../domain/product.model';
import { buildSku, isValidSku } from '../../../domain/sku.value-object';
import { COLOR_LABELS, SIZE_ORDER, sizeLabel } from '../../../domain/product-filtering';

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
export class AdminProductFormPage implements OnInit {
  readonly store = inject(CatalogStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly genderOptions = VARIANT_GENDERS;
  readonly sizeOptions = SIZE_ORDER;
  readonly colorOptions = Object.entries(COLOR_LABELS);
  readonly sizeLabel = sizeLabel;

  readonly editingId = signal<string | null>(null);
  readonly notFound = signal(false);

  // Form state
  readonly name = signal('');
  readonly description = signal('');
  readonly category = signal('');
  readonly price = signal(0);
  readonly imageUrl = signal('');
  readonly productCode = signal('');
  readonly published = signal(true);
  readonly featured = signal(false);
  readonly variants = signal<VariantRow[]>([
    { gender: 'U', size: 'M', color: 'NEG', stock: 0 },
  ]);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.store.loadCatalog();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const product = this.store.allProducts().find(p => p.id === id);
    if (!product) {
      // Catalog may still be loading over HTTP on a fresh entry: try again shortly
      setTimeout(() => this.loadForEdit(id), 400);
      return;
    }
    this.fillForm(id);
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
    this.imageUrl.set(product.imageUrl);
    this.published.set(product.published);
    this.featured.set(product.featured);
    // The product code lives inside every SKU: RS-[CODE]-...
    this.productCode.set(product.variants[0]?.sku.split('-')[1] ?? '');
    this.variants.set(
      product.variants.map(v => ({
        gender: v.gender,
        size: v.size,
        color: v.color,
        stock: v.totalStock,
      }))
    );
  }

  /** Live SKU preview per row ('—' while the parts are incomplete/invalid) */
  skuFor(row: VariantRow): string {
    try {
      return buildSku(this.productCode(), row.gender, row.size, row.color);
    } catch {
      return '—';
    }
  }

  readonly canSave = computed(() => {
    if (!this.name().trim() || !this.category().trim() || this.price() <= 0) return false;
    if (!/^[A-Za-z0-9]{2,6}$/.test(this.productCode())) return false;
    const rows = this.variants();
    if (rows.length === 0 || rows.some(r => r.stock < 0)) return false;
    const skus = rows.map(r => `RS-${this.productCode()}-${r.gender}-${r.size}-${r.color}`.toUpperCase());
    return skus.every(sku => isValidSku(sku)) && new Set(skus).size === skus.length;
  });

  onText(field: 'name' | 'description' | 'category' | 'imageUrl' | 'productCode', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
  }

  onPrice(event: Event): void {
    this.price.set(Number((event.target as HTMLInputElement).value) || 0);
  }

  updateRow(index: number, field: keyof VariantRow, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.variants.update(rows =>
      rows.map((row, i) =>
        i === index
          ? { ...row, [field]: field === 'stock' ? Math.max(0, Number(value) || 0) : value }
          : row
      )
    );
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
        sku: buildSku(this.productCode(), row.gender, row.size, row.color),
        gender: row.gender,
        size: row.size,
        color: row.color,
        totalStock: row.stock,
      }));
    } catch (e) {
      this.error.set((e as Error).message);
      return;
    }

    const data = {
      name: this.name().trim(),
      description: this.description().trim(),
      category: this.category().trim(),
      price: this.price(),
      imageUrl: this.imageUrl().trim() || '/images/products/placeholder.jpg',
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
    this.router.navigate(['/admin/productos']);
  }
}
