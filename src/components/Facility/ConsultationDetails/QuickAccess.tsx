import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import query from "@/Utils/request/query";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface QuickAccessProps {
  facilityId: string;
  patientId: string;
  encounterId: string;
}

export default function QuickAccess({
  facilityId,
  patientId,
  encounterId,
}: QuickAccessProps) {
  const { t } = useTranslation();

  const { data: response } = useQuery({
    queryKey: ["questionnaires"],
    queryFn: query(questionnaireApi.list),
  });

  const questionnaireList = response?.results || [];

  const encounterSettings = [
    { id: "encounter_settings", label: t("encounter_settings") },
    { id: "treatment_summary", label: t("treatment_summary") },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Questionnaire Section */}
      <section className="space-y-2 p-2">
        <h3 className="text-lg font-semibold mb-3">{t("questionnaire")}</h3>
        <div className="space-y-3 p-2 font-medium">
          {questionnaireList.map((item) => (
            <Link
              className="flex items-center gap-2 text-sm hover:text-gray-500 text-gray-900"
              key={item.id}
              // className="w-full justify-start gap-2 h-auto py-2"
              href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${item.slug}`}
            >
              <CareIcon icon="l-file-alt" className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </div>
      </section>

      {/* Update Encounter Details */}
      <section>
        <h3 className="text-lg font-medium mb-3">
          {t("update_encounter_details")}
        </h3>
        <div className="space-y-2">
          {encounterSettings.map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox id={item.id} />
              <label htmlFor={item.id} className="text-sm">
                {item.label}
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Departments and Teams */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">{t("departments_and_teams")}</h3>
          <Button
            variant="outline"
            size="sm"
            // onClick={onDepartmentUpdate}
            className="text-xs"
          >
            {t("update_department")}
            <CareIcon icon="l-plus" className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{t("cardiology")}</Badge>
          <Badge variant="secondary">{t("cardiology")}</Badge>
        </div>
      </section>

      {/* Tags */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">{t("tags")}</h3>
          <Button
            variant="outline"
            size="sm"
            // onClick={onTagUpdate}
            className="text-xs"
          >
            {t("add_tags")}
            <CareIcon icon="l-plus" className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="destructive">{t("medico_legal_case")}</Badge>
          <Badge variant="destructive">{t("medico_legal_case")}</Badge>
        </div>
      </section>

      {/* Hospitalisation Details */}
      <section>
        <h3 className="text-lg font-medium mb-3">
          {t("hospitalisation_details")}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("admit_source")}</span>
            <span>{t("nursing_home")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("diet_preference")}
            </span>
            <span>{t("dairy_free")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("re_admission")}</span>
            <span>{t("yes")}</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full mt-3"
          // onClick={() => onUpdateDetails?.("hospitalisation")}
        >
          {t("update_hospitalisation_details")}
        </Button>
      </section>
    </div>
  );
}
