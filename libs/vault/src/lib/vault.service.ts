import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from './vault.module.definition';
import { LoginResponse, ReadKvResponse, VaultModuleOptions } from './types';

import { EventEmitter, once } from 'events';

const tokenEvent = new EventEmitter();

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);
  private vaultUrl: string;
  private roleId: string;
  private secretId: string;
  private token?: string;
  private loginInProgress = false;

  constructor(
    private readonly http: HttpService,
    @Inject(MODULE_OPTIONS_TOKEN)
    readonly moduleOptions: VaultModuleOptions,
  ) {
    this.vaultUrl = moduleOptions.vaultUrl;
    this.roleId = moduleOptions.roleId;
    this.secretId = moduleOptions.secretId;
  }

  public async get<T = any>(path: string) {
    const url = `${this.vaultUrl}/v1/${path}`;
    await this.ensureToken();
    const data = await this.http.axiosRef.get<ReadKvResponse>(url, {
      headers: {
        'X-Vault-Token': this.token,
      },
    });

    return data.data.data.data as T;
  }

  private async login() {
    this.loginInProgress = true;
    const loginUrl = `${this.vaultUrl}/v1/auth/approle/login`;
    const response = await this.http.axiosRef.post<LoginResponse>(loginUrl, {
      role_id: this.roleId,
      secret_id: this.secretId,
    });

    this.token = response.data?.auth?.client_token;
    this.logger.debug(`token retrieved`);
    tokenEvent.emit('done');
    this.loginInProgress = false;
    if (response.data?.lease_duration === 0) return;

    this.logger.debug(`Token expires in ${response.data?.lease_duration}`);
    setTimeout(() => {
      this.login();
    }, response.data?.lease_duration || 60 * 60 * 1000);
  }

  private async ensureToken() {
    if (!this.token) {
      if (this.loginInProgress) {
        await once(tokenEvent, 'done');
      } else {
        await this.login();
      }
    }
  }
}
