export enum Sender {
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
}

export type IEvent = {
  id: string;
  sessionID: string;
  type: string;
  data: any;
  sender: Sender;
  createdAt: Date;
  acknowledgedOn?: Date;
};

export type FindCriteria = {
  sessionID?: string;
  since?: Date;
  limit?: number;
};

export interface IEventStore {
  save(
    event: Omit<IEvent, 'id' | 'createdAt' | 'acknowledgedOn'>,
  ): Promise<IEvent>;
  findOne(id: string): Promise<IEvent | null>;
  find(findCriteria: FindCriteria): Promise<IEvent[]>;
  acknowledge(id: string): Promise<IEvent | null>;
}
