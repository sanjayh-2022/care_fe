import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { t } from "i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { MedicationsTable } from "@/components/Medicine/MedicationsTable";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

import api from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatPatientAge } from "@/Utils/utils";
import { Encounter } from "@/types/emr/encounter";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

import { MedicationStatementList } from "./MedicationStatementList";

interface TreatmentSummaryProps {
  facilityId: string;
  encounterId: string;
}

export default function TreatmentSummary({
  facilityId,
  encounterId,
}: TreatmentSummaryProps) {
  const { data: encounter } = useQuery<Encounter>({
    queryKey: ["encounter", encounterId],
    queryFn: query(api.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
  });

  const { data: medications } = useQuery({
    queryKey: ["medication_requests", encounter?.patient?.id],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId: encounter?.patient?.id || "" },
      queryParams: { encounter: encounterId, limit: 50, offset: 0 },
    }),
    enabled: !!encounter?.patient?.id,
  });

  if (!encounter?.patient) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500">
        {t("no_patient_record_found")}
      </div>
    );
  }

  return (
    <PrintPreview
      title={`${t("treatment_summary")} - ${encounter.patient.name}`}
      disabled={!encounter?.patient}
    >
      <div className="min-h-screen bg-white py-2 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start pb-2 border-b">
            <div className="space-y-4 flex-1">
              <div>
                <h1 className="text-3xl font-semibold">
                  {encounter.facility?.name}
                </h1>
                <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold mt-1">
                  {t("treatment_summary")}
                </h2>
              </div>
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain ml-6"
            />
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-3">
              <DetailRow
                label={t("patient")}
                value={encounter.patient.name}
                isStrong
              />
              <DetailRow
                label={`${t("age")} / ${t("sex")}`}
                value={`${formatPatientAge(encounter.patient, true)}, ${t(`GENDER__${encounter.patient.gender}`)}`}
                isStrong
              />
              <DetailRow
                label={t("encounter_class")}
                value={t(`encounter_class__${encounter.encounter_class}`)}
                isStrong
              />
              {encounter.type?.text && (
                <DetailRow
                  label={t("encounter_type")}
                  value={encounter.type.text}
                  isStrong
                />
              )}
              {encounter.department?.name && (
                <DetailRow
                  label={t("department")}
                  value={encounter.department.name}
                  isStrong
                />
              )}
              <DetailRow
                label={t("priority")}
                value={t(`encounter_priority__${encounter.priority}`)}
                isStrong
              />
              {encounter.hospitalization?.admit_source && (
                <DetailRow
                  label={t("admission_source")}
                  value={t(
                    `encounter_admit_sources__${encounter.hospitalization.admit_source}`,
                  )}
                  isStrong
                />
              )}
              {encounter.hospitalization?.re_admission && (
                <DetailRow label={t("readmission")} value={t("yes")} isStrong />
              )}
            </div>
            <div className="space-y-3">
              <DetailRow
                label={t("mobile_number")}
                value={encounter.patient.phone_number}
                isStrong
              />
              {encounter.period?.start && (
                <DetailRow
                  label={t("encounter_date")}
                  value={format(
                    new Date(encounter.period.start),
                    "dd MMM yyyy, EEEE",
                  )}
                  isStrong
                />
              )}
              <DetailRow
                label={t("status")}
                value={t(`encounter_status__${encounter.status}`)}
                isStrong
              />

              {encounter.consulting_doctor && (
                <DetailRow
                  label={t("consulting_doctor")}
                  value={`${encounter.consulting_doctor.first_name} ${
                    encounter.consulting_doctor.last_name
                  }${
                    encounter.consulting_doctor.qualification
                      ? ` (${encounter.consulting_doctor.qualification})`
                      : ""
                  }`}
                  isStrong
                />
              )}
              {encounter.external_identifier && (
                <DetailRow
                  label={t("external_id")}
                  value={encounter.external_identifier}
                  isStrong
                />
              )}
              {encounter.hospitalization?.discharge_disposition && (
                <DetailRow
                  label={t("discharge_disposition")}
                  value={t(
                    `encounter_discharge_disposition__${encounter.hospitalization.discharge_disposition}`,
                  )}
                  isStrong
                />
              )}
              {encounter.hospitalization?.diet_preference && (
                <DetailRow
                  label={t("diet_preference")}
                  value={t(
                    `encounter_diet_preference__${encounter.hospitalization.diet_preference}`,
                  )}
                  isStrong
                />
              )}
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-6">
            {/* Allergies */}
            <AllergyList
              patientId={encounter.patient.id}
              encounterId={encounterId}
              className="border-none shadow-none"
              isPrintPreview={true}
            />

            {/* Symptoms */}
            <SymptomsList
              patientId={encounter.patient.id}
              encounterId={encounterId}
              className="border-none shadow-none"
              isPrintPreview={true}
            />

            {/* Diagnoses */}
            <DiagnosisList
              patientId={encounter.patient.id}
              encounterId={encounterId}
              className="border-none shadow-none"
              isPrintPreview={true}
            />

            {/* Medications */}
            <div className="border-none shadow-none space-y-2">
              <p className="text-sm font-semibold text-gray-950">
                {t("medications")}
              </p>
              <MedicationsTable medications={medications?.results || []} />
            </div>
          </div>

          {/* Medication Statements */}
          <MedicationStatementList
            patientId={encounter.patient.id}
            className="border-none shadow-none"
            isPrintPreview={true}
          />

          {/* Questionnaire Responses Section */}
          <div>
            <QuestionnaireResponsesList
              encounter={encounter}
              patientId={encounter.patient.id}
              isPrintPreview={true}
              onlyUnstructured={true}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 space-y-1 pt-2 text-[10px] text-gray-500 flex justify-between">
          <p>
            {t("generated_on")} {format(new Date(), "PPP 'at' p")}
          </p>
        </div>
      </div>
    </PrintPreview>
  );
}

const DetailRow = ({
  label,
  value,
  isStrong = false,
}: {
  label: string;
  value?: string | null;
  isStrong?: boolean;
}) => {
  return (
    <div className="flex">
      <span className="text-gray-600 w-32">{label}</span>
      <span className="text-gray-600">: </span>
      <span className={`ml-1 ${isStrong ? "font-semibold" : ""}`}>
        {value || "-"}
      </span>
    </div>
  );
};
