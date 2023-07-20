import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ModuleOptions } from './types';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ModuleOptions>().build();
