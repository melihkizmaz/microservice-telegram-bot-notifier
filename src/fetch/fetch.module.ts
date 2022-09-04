import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { FetchService } from './fetch.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [FetchService],
  exports: [FetchService],
})
export class FetchModule {}
