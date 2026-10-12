import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('me')
  async me(@CurrentUser() user: { userId: string; jti: string }) {
    return this.service.getMe(user.userId);
  }
}
