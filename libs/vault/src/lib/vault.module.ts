import { Global, Module } from '@nestjs/common';
import { VaultService } from './vault.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigurableModuleClass } from './vault.module.definition';

@Global()
@Module({
  imports: [HttpModule],
  providers: [VaultService],
  exports: [VaultService],
})
export class VaultModule extends ConfigurableModuleClass {}
