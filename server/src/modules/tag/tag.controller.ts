import { Controller, Get } from "@nestjs/common";
import { TagService } from "./tag.service";

@Controller("tag")
export class TagController {
  constructor(private readonly service: TagService) {}

  // TODO: 接口实现见 docs/architecture.md §6
}
