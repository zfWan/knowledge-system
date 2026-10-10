import { Controller, Get } from "@nestjs/common";
import { AuditService } from "./audit.service";

@Controller("audit")
export class AuditController {
  constructor(private readonly service: AuditService) {}

  // TODO: 接口实现见 docs/architecture.md §6
}
