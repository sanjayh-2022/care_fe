import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import PageHeadTitle from "@/components/Common/PageHeadTitle";
import PageTitle from "@/components/Common/PageTitle";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import PatientInfoCard from "@/components/Patient/PatientInfoCard";

import { useCareAppConsultationTabs } from "@/hooks/useCareApps";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, keysOf } from "@/Utils/utils";
import { EncounterFilesTab } from "@/pages/Encounters/tabs/EncounterFilesTab";
import { EncounterMedicinesTab } from "@/pages/Encounters/tabs/EncounterMedicinesTab";
import { EncounterPlotsTab } from "@/pages/Encounters/tabs/EncounterPlotsTab";
import { EncounterUpdatesTab } from "@/pages/Encounters/tabs/EncounterUpdatesTab";
import { Encounter } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/newPatient";

import { EncounterNotesTab } from "./tabs/EncounterNotesTab";

export interface EncounterTabProps {
  facilityId: string;
  encounter: Encounter;
  patient: Patient;
}

const defaultTabs = {
  // feed: EncounterFeedTab,
  updates: EncounterUpdatesTab,
  plots: EncounterPlotsTab,
  medicines: EncounterMedicinesTab,
  files: EncounterFilesTab,
  notes: EncounterNotesTab,
  // nursing: EncounterNursingTab,
  // neurological_monitoring: EncounterNeurologicalMonitoringTab,
  // pressure_sore: EncounterPressureSoreTab,
} as Record<string, React.FC<EncounterTabProps>>;

interface Props {
  encounterId: string;
  facilityId: string;
  tab?: string;
}

export const EncounterShow = (props: Props) => {
  const { facilityId, encounterId } = props;
  const { t } = useTranslation();
  const pluginTabs = useCareAppConsultationTabs();

  const tabs: Record<string, React.FC<EncounterTabProps>> = {
    ...defaultTabs,
    ...pluginTabs,
  };

  const { data: encounterData, isLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(routes.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: {
        facility: facilityId,
      },
    }),
    enabled: !!encounterId,
  });

  if (isLoading || !encounterData) {
    return <Loading />;
  }

  const encounterTabProps: EncounterTabProps = {
    encounter: encounterData,
    patient: encounterData.patient,
    facilityId,
  };

  if (!props.tab) {
    return <ErrorPage />;
  }

  if (!encounterData) {
    return <ErrorPage />;
  }

  const SelectedTab = tabs[props.tab];

  const tabButtonClasses = (selected: boolean) =>
    `capitalize min-w-max-content cursor-pointer font-bold whitespace-nowrap ${
      selected === true
        ? "border-primary-500 hover:border-secondary-300 text-primary-600 border-b-2"
        : "text-secondary-700 hover:text-secondary-700"
    }`;

  return (
    <div>
      <nav className="relative flex flex-wrap items-start justify-between">
        <PageTitle title={t("encounter")} />
        <div
          className="flex w-full flex-col min-[1150px]:w-min min-[1150px]:flex-row min-[1150px]:items-center"
          id="consultationpage-header"
        >
          {/* {!consultationData.discharge_date && (
            <>
              <button
                id="doctor-connect-button"
                onClick={() => {
                  triggerGoal("Doctor Connect Clicked", {
                    consultationId,
                    facilityId: patientData.facility,
                    userId: authUser.id,
                    page: "ConsultationDetails",
                  });
                  setShowDoctors(true);
                }}
                className="btn btn-primary m-1 w-full hover:text-white"
              >
                Doctor Connect
              </button>
              {patientData.last_consultation?.id &&
                isCameraAttached &&
                CameraFeedPermittedUserTypes.includes(authUser.user_type) && (
                  <Link
                    href={`/facility/${patientData.facility}/patient/${patientData.id}/consultation/${patientData.last_consultation?.id}/feed`}
                    className="btn btn-primary m-1 w-full hover:text-white"
                  >
                    Camera Feed
                  </Link>
                )}
            </>
          )} */}
        </div>
      </nav>
      <div className="mt-4 xl:mt-0 w-full border-b-2 border-secondary-200">
        <div className="mt-2 xl:mt-0 flex w-full flex-col md:flex-row">
          <div className="size-full rounded-lg border bg-white text-black shadow">
            <PatientInfoCard
              patient={encounterData.patient}
              encounter={encounterData}
              fetchPatientData={() => {}}
            />

            <div className="flex flex-col justify-between gap-2 px-4 py-1 md:flex-row">
              <div className="font-base flex flex-col text-xs leading-relaxed text-secondary-700 md:text-right">
                <div className="flex items-center">
                  <span className="text-secondary-900">
                    {t("last_modified")}:{" "}
                  </span>
                  &nbsp;
                  {formatDateTime(encounterData.modified_date)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 w-full border-b-2 border-secondary-200">
          <div className="overflow-x-auto sm:flex sm:items-baseline">
            <div className="mt-4 sm:mt-0">
              <nav
                className="flex space-x-6 overflow-x-auto pb-2 pl-2"
                id="encounter_tab_nav"
              >
                {keysOf(tabs).map((tab) => (
                  <Link
                    key={tab}
                    className={tabButtonClasses(props.tab === tab)}
                    href={`/facility/${facilityId}/encounter/${encounterData.id}/${tab}`}
                  >
                    {t(`ENCOUNTER_TAB__${tab}`)}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <PageHeadTitle title={t(`ENCOUNTER_TAB__${props.tab}`)} />
          <SelectedTab {...encounterTabProps} />
        </div>
      </div>
    </div>
  );
};
