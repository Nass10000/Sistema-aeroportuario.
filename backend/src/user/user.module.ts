import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController, AuthTestController } from './user.controller';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, RolesGuard, JwtAuthGuard],
  controllers: [UserController, AuthTestController],
  exports: [UserService],
})
export class UserModule {}
