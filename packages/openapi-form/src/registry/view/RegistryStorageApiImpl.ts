/*
 * Copyright 2023 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FormUri, RegistryStorageApi } from "../api";

export class RegistryStorageApiImpl implements RegistryStorageApi {
  constructor(private readonly memory: RegistryStorageApi = new InMemomryStorage()) {}

  async add(formUri: FormUri): Promise<void> {
    return this.memory.add(formUri);
  }

  async get(operationId: string, openApiSchemaLocation: string): Promise<FormUri | undefined> {
    return this.memory.get(operationId, openApiSchemaLocation);
  }

  async getAll(): Promise<Record<string, FormUri[]>> {
    return this.memory.getAll();
  }

  async delete(operationId: string, openApiSchemaLocation: string): Promise<void> {
    return this.memory.delete(operationId, openApiSchemaLocation);
  }
}

class InMemomryStorage implements RegistryStorageApi {
  private memory: Record<string, Record<string, FormUri>>;
  constructor() {
    this.memory = {};
  }

  async add(formUri: FormUri): Promise<void> {
    if (!this.memory[formUri.openApiSchemaLocation]) {
      this.memory[formUri.openApiSchemaLocation] = {};
    }
    this.memory[formUri.openApiSchemaLocation][formUri.operationId] = formUri;
  }

  async get(operationId: string, openApiSchemaLocation: string): Promise<FormUri | undefined> {
    return this.memory[openApiSchemaLocation][operationId];
  }

  async getAll(): Promise<Record<string, FormUri[]>> {
    return Object.keys(this.memory).reduce((prev: Record<string, FormUri[]>, curr) => {
      prev[curr] = Object.values(this.memory[curr]);
      return prev;
    }, {});
  }

  async delete(operationId: string, openApiSchemaLocation: string): Promise<void> {
    delete this.memory[openApiSchemaLocation][operationId];
    if (Object.values(this.memory[openApiSchemaLocation]).length === 0) {
      delete this.memory[openApiSchemaLocation];
    }
  }
}
