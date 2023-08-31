import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ConfigModuleOptions } from './types';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().build();
