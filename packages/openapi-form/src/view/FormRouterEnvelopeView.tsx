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

import * as React from "react";
import { useEffect, useState } from "react";
import { EnvelopeDivConfig, EnvelopeIFrameConfig } from "@kie-tools-core/envelope";
import { init } from "../envelope";
import { FormRouterFactoryImpl } from "./FormRouterFactoryImpl";
import { EnvelopeBus } from "@kie-tools-core/envelope-bus/dist/api";

export const FormRouterEnvelopeView = (props: {
  envelopeConfig: EnvelopeDivConfig | EnvelopeIFrameConfig;
  bus?: EnvelopeBus;
}) => {
  const [view, setView] = useState<React.ReactElement>();

  useEffect(() => {
    init({
      bus: props.bus ?? {
        postMessage: (message, _targetOrigin, transfer) => window.parent.postMessage(message, "*", transfer),
      },
      formFactory: new FormRouterFactoryImpl(setView),
    }).catch((error) => console.error(error));
  }, [props.envelopeConfig, props.bus]);

  return <div>{view}</div>;
};
