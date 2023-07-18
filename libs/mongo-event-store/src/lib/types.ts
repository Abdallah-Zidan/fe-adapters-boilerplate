import { Logger } from '@nestjs/common';
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

export interface ModuleOptions extends MongooseModuleFactoryOptions {
  logger?: Logger;
}
