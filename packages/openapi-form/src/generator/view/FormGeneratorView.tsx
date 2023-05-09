import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { SwfServiceCatalogService } from "@kie-tools/serverless-workflow-service-catalog/dist/api";
import { FormGeneratorApiImpl } from "./FormGeneratorApiImpl";
import { Uniforms } from "./uniforms";

interface Props {
  onSubmit: (data: object) => Promise<void>;
  catalogStore: SwfServiceCatalogService[];
  openApiSchemaLocation: string;
  operationId: string;
}

export const FormGeneratorView = (props: Props) => {
  const formGeneratorApi = useMemo(() => new FormGeneratorApiImpl(props.catalogStore), props.catalogStore);
  const formSchema = formGeneratorApi.generate(props.openApiSchemaLocation, props.operationId);
  const [schema, setSchema] = useState(formSchema?.schema);

  useEffect(() => {
    setSchema(formGeneratorApi.generate(props.openApiSchemaLocation, props.operationId)?.schema);
  }, [props.openApiSchemaLocation, props.operationId]);
  return (
    <div>
      {props.operationId}
      {schema ? <Uniforms schema={schema} onSubmit={props.onSubmit} /> : <div>Operation not found</div>}
    </div>
  );
};
