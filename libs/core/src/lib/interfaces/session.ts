export interface ISessionManager {
  findOne(sessionID: string): Promise<Session | null>;
  create(sessionID: string): Promise<any>;
  delete(sessionID: string): Promise<void>;
}

export type Session = {
  id: string;
  lastActivity?: Date;
  isActive?: boolean;
};
