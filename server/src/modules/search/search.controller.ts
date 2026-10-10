import { Controller, Get } from "@nestjs/common";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
  constructor(private readonly service: SearchService) {}

  // TODO: 接口实现见 docs/architecture.md §6
}
