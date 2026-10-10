import { Controller, Get } from "@nestjs/common";
import { NoteService } from "./note.service";

@Controller("note")
export class NoteController {
  constructor(private readonly service: NoteService) {}

  // TODO: 接口实现见 docs/architecture.md §6
}
