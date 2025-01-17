/*
 * Copyright 2023 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { OpenAPIV3 } from "openapi-types";
import { SwfServiceCatalogService } from "../../../../api";
import { parseOpenApi } from "./openapi";
import { ArgsType, SpecParser } from "../SpecParser";

export class OpenApiParser implements SpecParser<OpenAPIV3.Document> {
  canParse(content: any): boolean {
    return content.openapi && content.info && content.paths;
  }

  parse(serviceOpenApiDocument: OpenAPIV3.Document, args: ArgsType): SwfServiceCatalogService {
    return parseOpenApi(args, serviceOpenApiDocument);
  }
}
