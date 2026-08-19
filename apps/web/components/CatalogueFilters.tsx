"use client";

import { Field } from "./Field";
import type { Category, SortOption } from "../lib/types";

export interface CatalogueFilterValues {
  q: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  sort: SortOption;
}

const SORT_LABELS: { value: SortOption; label: string }[] = [
  { value: "name_asc", label: "Name: A to Z" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const selectClasses =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text";

export function CatalogueFilters({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: CatalogueFilterValues;
  onChange: (value: CatalogueFilterValues) => void;
}) {
  return (
    <div className="mb-6 rounded-card border border-border bg-surface p-4 shadow-card">
      <Field
        id="catalogue-search"
        label="Search"
        value={value.q}
        onChange={(q) => onChange({ ...value, q })}
        placeholder="Search products"
      />

      <div className="mb-4">
        <label htmlFor="catalogue-category" className="mb-1 block text-sm font-medium text-text">
          Category
        </label>
        <select
          id="catalogue-category"
          name="catalogue-category"
          value={value.category}
          onChange={(event) => onChange({ ...value, category: event.target.value })}
          className={selectClasses}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          id="catalogue-min-price"
          label="Lowest price (cents)"
          type="number"
          value={value.minPrice}
          onChange={(minPrice) => onChange({ ...value, minPrice })}
        />
        <Field
          id="catalogue-max-price"
          label="Highest price (cents)"
          type="number"
          value={value.maxPrice}
          onChange={(maxPrice) => onChange({ ...value, maxPrice })}
        />
      </div>

      <div>
        <label htmlFor="catalogue-sort" className="mb-1 block text-sm font-medium text-text">
          Sort by
        </label>
        <select
          id="catalogue-sort"
          name="catalogue-sort"
          value={value.sort}
          onChange={(event) => onChange({ ...value, sort: event.target.value as SortOption })}
          className={selectClasses}
        >
          {SORT_LABELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
