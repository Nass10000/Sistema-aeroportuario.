import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    try {
      this.logger.log(`Attempting to validate user with email: ${email}`);
      
      const user = await this.userService.findByEmail(email);
      if (!user) {
        this.logger.warn(`User not found with email: ${email}`);
        return null;
      }

      this.logger.log(`User found, comparing passwords...`);
      const isPasswordValid = await bcrypt.compare(pass, user.password);
      
      if (isPasswordValid) {
        this.logger.log(`Password validation successful for user: ${email}`);
        const { password, ...result } = user;
        return result;
      } else {
        this.logger.warn(`Password validation failed for user: ${email}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      return null;
    }
  }

  async login(user: any) {
    try {
      this.logger.log(`Creating JWT token for user: ${user.email}`);
      
      const payload = { 
        username: user.email, 
        sub: user.id, 
        role: user.role,
        stationId: user.stationId,
        supervisorId: user.supervisorId
      };
      const token = this.jwtService.sign(payload);
      
      this.logger.log(`JWT token created successfully for user: ${user.email}`);
      
      return {
        access_token: token,
        user: user,
      };
    } catch (error) {
      this.logger.error(`Error creating JWT token: ${error.message}`, error.stack);
      throw error;
    }
  }

  async register(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.userService.create({ ...createUserDto, password: hashedPassword });
  }

  async getUserCount(): Promise<number> {
    try {
      return await this.userService.count();
    } catch (error) {
      this.logger.error(`Error getting user count: ${error.message}`, error.stack);
      throw error;
    }
  }
}
