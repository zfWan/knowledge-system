import { Controller, Get } from "@nestjs/common";
import { QuotaService } from "./quota.service";

@Controller("quota")
export class QuotaController {
  constructor(private readonly service: QuotaService) {}

  // TODO: 接口实现见 docs/architecture.md §6
}
