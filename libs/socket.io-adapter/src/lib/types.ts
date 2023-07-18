import { Logger } from '@nestjs/common';
import { Socket as Original } from 'socket.io';

export interface ExtendedSocket extends Original {
  sessionID?: string;
}

export type ModuleOptions = {
  logger?: Logger;
};
