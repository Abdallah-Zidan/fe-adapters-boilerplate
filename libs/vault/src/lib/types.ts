import { ConfigurableModuleAsyncOptions } from '@nestjs/common';

export type VaultModuleOptions = {
  roleId: string;
  secretId: string;
  vaultUrl: string;
};

export type VaultModuleAsyncOptions =
  ConfigurableModuleAsyncOptions<VaultModuleOptions>;

export interface LoginResponse {
  auth: Auth;
  warnings: null;
  wrap_info: null;
  data: null;
  lease_duration: number;
  renewable: boolean;
  lease_id: string;
}

export interface Auth {
  renewable: boolean;
  lease_duration: number;
  metadata: null;
  token_policies: string[];
  accessor: string;
  client_token: string;
}

export interface ReadKvResponse {
  data: ReadKvResponseData;
}

export interface ReadKvResponseData {
  data: Record<string, any>;
  metadata: Metadata;
}

export interface Metadata {
  created_time: string;
  custom_metadata: CustomMetadata;
  deletion_time: string;
  destroyed: boolean;
  version: number;
}

export interface CustomMetadata {
  owner: string;
  mission_critical: string;
}
