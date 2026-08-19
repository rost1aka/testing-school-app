import { Controller, Get, Query } from "@nestjs/common";
import { catalogueQuerySchema, CatalogueQuery } from "@school/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CataloguePage, CategoryView, CatalogService } from "./catalog.service";

// The catalogue is public: a visitor browses it before they have an account,
// and their cart is waiting for them if they make one.
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("products")
  list(
    @Query(new ZodValidationPipe(catalogueQuerySchema)) query: CatalogueQuery,
  ): Promise<CataloguePage> {
    return this.catalogService.list(query);
  }

  @Get("categories")
  listCategories(): Promise<CategoryView[]> {
    return this.catalogService.listCategories();
  }
}
