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

import { EnvelopeBus } from "@kie-tools-core/envelope-bus/dist/api";
import { Envelope } from "@kie-tools-core/envelope";
import { FormRouterFactory } from "./FormRouterFactory";
import { FormRouterEnvelopeApi, FormRouterChannelApi } from "../api";
import { FormRouterEnvelopeApiImpl } from "./FormRouterEnvelopeApiImpl";

export type FormType = HTMLElement | void;

export function init(args: { bus: EnvelopeBus; formFactory: FormRouterFactory }) {
  const envelope = new Envelope<FormRouterEnvelopeApi, FormRouterChannelApi, FormType, {}>(args.bus);

  return envelope.start(
    () => Promise.resolve(() => {}),
    {},
    {
      create: (apiFactoryArgs) => new FormRouterEnvelopeApiImpl(apiFactoryArgs, args.formFactory),
    }
  );
}
