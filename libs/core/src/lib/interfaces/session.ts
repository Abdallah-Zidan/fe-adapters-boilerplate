export interface ISessionManager {
  exists(sessionID: string): Promise<boolean>;
  findOne<T = object>(sessionID: string): Promise<Session<T> | null>;
  create<T = object>(
    sessionID: string,
    data: CreateSessionData<T>,
    seconds?: number
  ): Promise<void>;
  update<T = object>(
    sessionID: string,
    data: UpdateSessionData<T>,
    seconds?: number
  ): Promise<void>;
  refresh(sessionID: string, seconds?: number): Promise<void>;
  delete(sessionID: string): Promise<void>;
}

export type Session<T = object> = T & {
  id: string;
  channel: Channel;
  sessionStartTime: Date;
  isAuthenticated?: boolean;
  chatId?: string;
  chatToken?: string;
  mobile?: string;
  sessionEndTime?: Date;
  isNovomind?: boolean;
};

export const Channel = {
  WEB: 'WEB',
  FACEBOOK: 'FACEBOOK',
  WHATSAPP: 'WHATSAPP',
  MOBILE: 'MOBILE',
} as const;

export type Channel = typeof Channel[keyof typeof Channel];

type WithoutId<T> = Omit<T, 'id'>;
export type CreateSessionData<T = object> = WithoutId<Session<T>>;
export type UpdateSessionData<T = object> = WithoutId<Partial<Session<T>>>;
