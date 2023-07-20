import { Global, Module } from '@nestjs/common';
import { VaultService } from './vault.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigurableModuleClass } from './vault.module.definition';
import { CacheModule } from '@nestjs/cache-manager';
@Global()
@Module({
  imports: [HttpModule, CacheModule.register()],
  providers: [VaultService],
  exports: [VaultService],
})
export class VaultModule extends ConfigurableModuleClass {}
