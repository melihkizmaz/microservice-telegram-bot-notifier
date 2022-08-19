import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { IJwtPayload } from './dto/jwt-payload.interface';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  async register(createUserDto: CreateUserDto): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { email: createUserDto.email },
    });

    if (user) throw new ConflictException('Email already taken');

    const createdUser = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: await this.hashPassword(createUserDto.password),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const token = await this.generateJwt({
      id: createdUser.id,
      email: createdUser.email,
    });

    return token;
  }
  async login(loginUserDto: LoginUserDto): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { email: loginUserDto.email },
    });

    if (!user)
      throw new UnauthorizedException('Password or email is incorrect');

    const isPasswordValid = await this.valiadatePassword(
      user.password,
      loginUserDto.password,
    );

    if (!isPasswordValid)
      throw new UnauthorizedException('Password or email is incorrect');

    const token = await this.generateJwt({
      id: user.id,
      email: user.email,
    });

    return token;
  }
  private async generateJwt(payload: IJwtPayload): Promise<string> {
    return this.jwtService.signAsync({ id: payload.id, email: payload.email });
  }
  private async valiadatePassword(
    userPassword: string,
    password: string,
  ): Promise<string> {
    return bcrypt.compare(password, userPassword);
  }
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}
