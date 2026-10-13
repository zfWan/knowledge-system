import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        nickname: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        deletedAt: true,
      },
    });
    if (!user || user.deletedAt) {
      throw new NotFoundException({ code: 10404, message: '用户不存在' });
    }
    return user;
  }
}
