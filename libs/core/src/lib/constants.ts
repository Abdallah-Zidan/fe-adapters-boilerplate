export const SESSION_MANAGER_TOKEN = Symbol('SESSION_MANAGER');
export const EVENT_STORE_TOKEN = Symbol('EVENT_STORE');
export const SOCKET_ADAPTER_TOKEN = Symbol('SOCKET_ADAPTER');

export const CLIENT_EVENT = 'CLIENT_EVENT';
export const WEB_OUTPUT_EVENT = 'WEB_OUTPUT_EVENT';

export const WEB_OUTPUT_QUEUE = 'web-output-queue';
export const FACEBOOK_OUTPUT_QUEUE = 'facebook-output-queue';
export const WHATSAPP_OUTPUT_QUEUE = 'whatsapp-output-queue';
export const ORCHESTRATOR_INPUT_QUEUE = 'orchestrator-output-queue';
export const ORCHESTRATOR_QUEUE_CLIENT = Symbol(ORCHESTRATOR_INPUT_QUEUE);
export const WEB_QUEUE_CLIENT = Symbol(WEB_OUTPUT_QUEUE);
export const FACEBOOK_QUEUE_CLIENT = Symbol(FACEBOOK_OUTPUT_QUEUE);
export const WHATSAPP_QUEUE_CLIENT = Symbol(WHATSAPP_OUTPUT_QUEUE);

export const ReplyTo = {
  WEB_OUTPUT_QUEUE,
  FACEBOOK_OUTPUT_QUEUE,
  WHATSAPP_OUTPUT_QUEUE,
} as const;
export type ReplyTo = (typeof ReplyTo)[keyof typeof ReplyTo];
