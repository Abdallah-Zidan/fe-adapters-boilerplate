import { Inject } from '@nestjs/common';
import {
  CONFIG_MANAGER_TOKEN,
  EVENT_STORE_TOKEN,
  SESSION_MANAGER_TOKEN,
  SOCKET_ADAPTER_TOKEN,
} from '../constants';

export const SessionManager = () => Inject(SESSION_MANAGER_TOKEN);
export const EventStore = () => Inject(EVENT_STORE_TOKEN);
export const SocketAdapter = () => Inject(SOCKET_ADAPTER_TOKEN);
export const ConfigManager = () => Inject(CONFIG_MANAGER_TOKEN);
