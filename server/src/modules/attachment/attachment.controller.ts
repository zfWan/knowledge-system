import { Controller, Get } from "@nestjs/common";
import { AttachmentService } from "./attachment.service";

@Controller("attachment")
export class AttachmentController {
  constructor(private readonly service: AttachmentService) {}

  // TODO: 接口实现见 docs/architecture.md §6
}
