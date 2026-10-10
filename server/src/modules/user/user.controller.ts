import { Controller, Get } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
  constructor(private readonly service: UserService) {}

  // TODO: 接口实现见 docs/architecture.md §6
}
