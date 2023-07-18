import { IEvent } from './events';

export interface ISocketAdapter {
  start(server: any): Promise<any> | any;
  send(event: IEvent): Promise<any>;
}
