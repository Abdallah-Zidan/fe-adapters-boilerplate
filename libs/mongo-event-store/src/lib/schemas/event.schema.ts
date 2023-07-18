import { IEvent, Sender } from '@libs/core';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  autoIndex: true,
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: false,
  },
  versionKey: false,
})
export class Event implements IEvent {
  id!: string;

  @Prop()
  sessionID!: string;

  @Prop()
  type!: string;

  @Prop({
    type: Object,
    required: false,
  })
  data!: object;

  @Prop({
    type: String,
  })
  sender!: Sender;

  createdAt!: Date;

  @Prop({
    type: Date,
    required: false,
  })
  acknowledgedOn: Date | undefined;
}

export const EventSchema = SchemaFactory.createForClass(Event);

export type EventDocument = HydratedDocument<Event>;
