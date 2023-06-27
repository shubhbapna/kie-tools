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

import { EnvelopeApiFactoryArgs } from "@kie-tools-core/envelope";
import { Association, FormRouterEnvelopeApi, FormRouterInitArgs, FormRouterChannelApi, FormRouterApi } from "../api";
import { FormRouterViewProps } from "../router";
import { FormRouterFactory } from "./FormRouterFactory";

export class FormRouterEnvelopeApiImpl implements FormRouterEnvelopeApi {
  constructor(
    private readonly args: EnvelopeApiFactoryArgs<FormRouterEnvelopeApi, FormRouterChannelApi, void, {}>,
    private readonly formRouterFactory: FormRouterFactory
  ) {}

  formRouterApi?: () => FormRouterApi | null;

  public async form__init(association: Association, initArgs: FormRouterInitArgs) {
    this.args.envelopeClient.associate(association.origin, association.envelopeServerId);
    this.formRouterApi = this.formRouterFactory.create(initArgs, this.args.envelopeClient.manager.clientApi);
    this.args.envelopeClient.channelApi.notifications.form__ready.send();
  }

  public async form__setData(data: FormRouterViewProps) {
    return this.formRouterApi?.()?.setData(data);
  }
}
