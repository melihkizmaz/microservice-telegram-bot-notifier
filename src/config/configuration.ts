export interface Config {
  port: number;
  baseUrl: string;
  telegramBaseUrl: string;
}

const config = (): Config => ({
  port: Number(process.env.PORT),
  baseUrl: process.env.BASE_URL,
  telegramBaseUrl: process.env.TELEGRAM_BOT_BASE_URL,
});
export default config;
