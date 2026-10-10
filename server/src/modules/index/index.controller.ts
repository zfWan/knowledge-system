import { Controller, Get } from "@nestjs/common";
import { IndexService } from "./index.service";

@Controller("index")
export class IndexController {
  constructor(private readonly service: IndexService) {}

  // TODO: 接口实现见 docs/architecture.md §6
}
