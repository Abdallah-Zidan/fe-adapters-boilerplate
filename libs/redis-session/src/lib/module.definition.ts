import { ConfigurableModuleBuilder } from '@nestjs/common';
import { Options } from './types';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<Options>().build();
