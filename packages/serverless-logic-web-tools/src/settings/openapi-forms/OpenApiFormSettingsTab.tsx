import * as React from "react";
import { useRef, useEffect } from "react";
import { RegistryApi, RegistryFormView } from "@kie-tools/openapi-form";
import { Page, PageSection } from "@patternfly/react-core/dist/js/components/Page";
import { useSettingsDispatch } from "../SettingsContext";
import { useFormRegistryStorageContext } from "../../formRegistryStorage/FormRegistryStorageContext";
import { setPageTitle } from "../../PageTitle";
import { SETTINGS_PAGE_SECTION_TITLE } from "../SettingsContext";
import { SettingsPageProps } from "../types";

const PAGE_TITLE = "Open API Form Registry";

export function OpenApiFormSettings(props: SettingsPageProps) {
  const registryRef = useRef<RegistryApi>(null);
  const formRegistryStorageContext = useFormRegistryStorageContext();
  const settingsDispatch = useSettingsDispatch();

  useEffect(() => {
    setPageTitle([SETTINGS_PAGE_SECTION_TITLE, PAGE_TITLE]);
  }, []);

  return (
    <Page>
      <PageSection>
        <PageSection variant={"light"}>
          <RegistryFormView
            ref={registryRef}
            catalogStore={settingsDispatch.serviceRegistry.catalogStore.services}
            registryStorage={formRegistryStorageContext}
          />
        </PageSection>
      </PageSection>
    </Page>
  );
}
