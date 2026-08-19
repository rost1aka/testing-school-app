import { categoryWhere, searchWhere } from "./product-filters";

describe("searchWhere", () => {
  it("matches the name anywhere in it, ignoring case", () => {
    expect(searchWhere("lamp")).toEqual({ name: { contains: "lamp", mode: "insensitive" } });
  });

  it("is no filter at all when nothing was searched for", () => {
    expect(searchWhere(undefined)).toBeNull();
  });
});

describe("categoryWhere", () => {
  it("matches products that are in the category", () => {
    expect(categoryWhere("garden")).toEqual({
      categories: { some: { category: { slug: "garden" } } },
    });
  });

  it("is no filter at all when no category was chosen", () => {
    expect(categoryWhere(undefined)).toBeNull();
  });
});
