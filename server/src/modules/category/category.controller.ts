import { Controller, Get } from "@nestjs/common";
import { CategoryService } from "./category.service";

@Controller("category")
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  // TODO: 接口实现见 docs/architecture.md §6
}
