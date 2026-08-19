import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CatalogueFilters } from "../components/CatalogueFilters";
import type { Category } from "../lib/types";

const categories: Category[] = [
  { id: "cat_tools", slug: "tools", name: "Tools" },
  { id: "cat_paper", slug: "paper", name: "Paper" },
];

const value = { q: "", category: "", minPrice: "", maxPrice: "", sort: "name_asc" as const };

describe("CatalogueFilters", () => {
  it("offers every category it was given, plus all of them", () => {
    render(<CatalogueFilters categories={categories} value={value} onChange={vi.fn()} />);

    const select = screen.getByLabelText("Category");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Tools" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Paper" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "All categories" })).toBeInTheDocument();
  });

  it("reports what was typed into the search box", async () => {
    const onChange = vi.fn();
    render(<CatalogueFilters categories={categories} value={value} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("Search"), "l");

    expect(onChange).toHaveBeenCalledWith({ ...value, q: "l" });
  });

  it("reports a category choice", async () => {
    const onChange = vi.fn();
    render(<CatalogueFilters categories={categories} value={value} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText("Category"), "paper");

    expect(onChange).toHaveBeenCalledWith({ ...value, category: "paper" });
  });

  it("reports a new sort order", async () => {
    const onChange = vi.fn();
    render(<CatalogueFilters categories={categories} value={value} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText("Sort by"), "price_desc");

    expect(onChange).toHaveBeenCalledWith({ ...value, sort: "price_desc" });
  });
});
