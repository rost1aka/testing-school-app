"use client";

import { CataloguePanel } from "../../components/CataloguePanel";

export default function CataloguePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-text">Catalogue</h1>
      <CataloguePanel />
    </main>
  );
}
