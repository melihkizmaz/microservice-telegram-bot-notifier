import { JwtSignOptions } from '@nestjs/jwt';

export interface Config {
  port: number;
  baseUrl: string;
  telegramBaseUrl: string;
  jwtSecret: string;
  jwtSignOptions: JwtSignOptions;
}

const config = (): Config => ({
  port: Number(process.env.PORT),
  baseUrl: process.env.BASE_URL,
  telegramBaseUrl: process.env.TELEGRAM_BOT_BASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtSignOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN,
    algorithm: 'HS256',
  },
});
export default config;
