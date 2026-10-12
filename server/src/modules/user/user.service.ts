import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthUser } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string): Promise<AuthUser> {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) {
      // 不应发生：JWT 签发过用户 ID
      return {
        id: userId, email: null, nickname: '用户', status: 'active',
        createdAt: new Date(), avatarUrl: null, bio: null, lastLoginAt: null,
      };
    }
    return {
      id: u.id,
      email: u.email,
      nickname: u.nickname,
      status: u.status,
      createdAt: u.createdAt,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      lastLoginAt: u.lastLoginAt,
    };
  }
}
