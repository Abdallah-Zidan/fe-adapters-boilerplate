import { IEvent, FindCriteria, IEventStore } from '@libs/core';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { LOGGER } from './constants';

@Injectable()
export class MongoEventStoreService implements IEventStore {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @Inject(LOGGER) private readonly logger: Logger
  ) {}
  async save(event: Omit<IEvent, 'id'>): Promise<IEvent> {
    const model = new this.eventModel(event);
    const saved = await model.save();
    return modelToIEvent(saved);
  }

  async findOne(id: string): Promise<IEvent | null> {
    const event = await this.eventModel.findById(id);
    if (!event) {
      return null;
    }
    return modelToIEvent(event);
  }

  async find({ limit, sessionID, since }: FindCriteria): Promise<IEvent[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const criteria: Record<string, any> = {};
    let defaultLimit = 100;

    if (sessionID) {
      criteria['sessionID'] = sessionID;
    }

    if (limit && !since && limit > 100) {
      defaultLimit = limit;
    }

    if (since) {
      criteria['createdAt'] = { $gt: since };
    }

    this.logger.debug('%j', criteria);

    const events = await this.eventModel.find(criteria).limit(defaultLimit);
    return events.map(modelToIEvent);
  }

  async acknowledge(id: string): Promise<IEvent | null> {
    const event = await this.eventModel.findByIdAndUpdate(
      id,
      {
        $set: {
          acknowledgedOn: new Date(),
        },
      },
      {
        new: true,
      }
    );

    return event ? modelToIEvent(event) : null;
  }
}

function modelToIEvent(event: EventDocument) {
  return {
    id: event._id?.toString(),
    createdAt: event.createdAt,
    data: event.data,
    sender: event.sender,
    sessionID: event.sessionID,
    type: event.type,
    acknowledgedOn: event.acknowledgedOn,
  };
}
