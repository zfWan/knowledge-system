import { Controller, Get } from "@nestjs/common";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatController {
  constructor(private readonly service: ChatService) {}

  // TODO: 接口实现见 docs/architecture.md §6
}
