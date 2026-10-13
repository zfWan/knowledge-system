import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('me')
  me(@CurrentUser() user: { userId: string; jti: string }) {
    return this.service.me(user.userId);
  }
}
