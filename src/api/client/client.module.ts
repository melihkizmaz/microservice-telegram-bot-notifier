import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { FetchModule } from '../../fetch/fetch.module';

@Module({
  imports: [PrismaModule, FetchModule],
  providers: [ClientService],
  controllers: [ClientController],
  exports: [ClientService],
})
export class ClientModule {}
