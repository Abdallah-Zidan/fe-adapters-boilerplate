import { Module } from '@nestjs/common';
import { WSService } from './ws-adapter.service';
import { SOCKET_ADAPTER_TOKEN } from '@libs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    WSService,
    {
      provide: SOCKET_ADAPTER_TOKEN,
      useClass: WSService,
    },
  ],
  exports: [SOCKET_ADAPTER_TOKEN],
})
export class WsAdapterModule {}
