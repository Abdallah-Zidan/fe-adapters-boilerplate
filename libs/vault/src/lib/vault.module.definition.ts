import { ConfigurableModuleBuilder } from '@nestjs/common';
import { VaultModuleOptions } from './types';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<VaultModuleOptions>().build();
