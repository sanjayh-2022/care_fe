import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import {
  BeakerIcon,
  CookingPotIcon,
  HeartPulseIcon,
  LeafIcon,
} from "lucide-react";
import { Link } from "raviger";
import { ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import {
  ALLERGY_CLINICAL_STATUS_STYLES,
  ALLERGY_CRITICALITY_STYLES,
  ALLERGY_VERIFICATION_STATUS_STYLES,
  AllergyCategory,
  AllergyIntolerance,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import { Encounter, completedEncounterStatus } from "@/types/emr/encounter";

interface AllergyListProps {
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  className?: string;
  isPrintPreview?: boolean;
  encounterStatus?: Encounter["status"];
}

export const CATEGORY_ICONS: Record<AllergyCategory, ReactNode> = {
  food: <CookingPotIcon className="h-4 w-4" aria-label="Food allergy" />,
  medication: (
    <BeakerIcon className="h-4 w-4" aria-label="Medication allergy" />
  ),
  environment: (
    <LeafIcon className="h-4 w-4" aria-label="Environmental allergy" />
  ),
  biologic: (
    <HeartPulseIcon className="h-4 w-4" aria-label="Biologic allergy" />
  ),
};

export function AllergyList({
  facilityId,
  patientId,
  encounterId,
  className,
  isPrintPreview = false,
  encounterStatus,
}: AllergyListProps) {
  const [showEnteredInError, setShowEnteredInError] = useState(isPrintPreview);

  const { data: allergies, isLoading } = useQuery({
    queryKey: ["allergies", patientId, encounterId, encounterStatus],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
      queryParams: {
        encounter: completedEncounterStatus.includes(encounterStatus as string)
          ? encounterId
          : undefined,
      },
    }),
  });

  if (isLoading) {
    return (
      <AllergyListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      >
        <CardContent className="px-2 pb-2">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </AllergyListLayout>
    );
  }

  const filteredAllergies = allergies?.results?.filter(
    (allergy) =>
      showEnteredInError || allergy.verification_status !== "entered_in_error",
  );

  const hasEnteredInErrorRecords = allergies?.results?.some(
    (allergy) => allergy.verification_status === "entered_in_error",
  );

  if (!filteredAllergies?.length) {
    return (
      <AllergyListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      >
        <CardContent className="px-2 pb-3 pt-2">
          <p className="text-gray-500">{t("no_allergies_recorded")}</p>
        </CardContent>
      </AllergyListLayout>
    );
  }

  interface AllergyRowProps {
    allergy: AllergyIntolerance;
  }

  function AllergyRow({ allergy }: AllergyRowProps) {
    return (
      <TableRow
        className={`rounded-md overflow-hidden bg-gray-50 ${
          allergy.verification_status === "entered_in_error" ? "opacity-50" : ""
        }`}
      >
        <TableCell className="first:rounded-l-md">
          <div className="flex items-center">
            {CATEGORY_ICONS[allergy.category ?? ""]}
          </div>
        </TableCell>
        <TableCell className="font-medium pl-0 ">
          {allergy.code.display}
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={`whitespace-nowrap ${
              ALLERGY_CLINICAL_STATUS_STYLES[allergy.clinical_status]
            }`}
          >
            {t(allergy.clinical_status)}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={`whitespace-nowrap ${
              ALLERGY_CRITICALITY_STYLES[allergy.criticality]
            }`}
          >
            {t(allergy.criticality)}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={`whitespace-nowrap capitalize ${
              ALLERGY_VERIFICATION_STATUS_STYLES[allergy.verification_status]
            }`}
          >
            {t(allergy.verification_status)}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-gray-950">
          {allergy.note && (
            <div className="flex items-center gap-2">
              {isPrintPreview ? (
                <span className="text-gray-950 max-w-[200px]">
                  {allergy.note}
                </span>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs shrink-0"
                    >
                      {t("see_note")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {allergy.note}
                    </p>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
        </TableCell>
        <TableCell className="last:rounded-r-md">
          <div className="flex items-center gap-2">
            <Avatar
              name={allergy.created_by.username}
              className="w-4 h-4"
              imageUrl={allergy.created_by.profile_picture_url}
            />
            <span className="text-sm">{formatName(allergy.created_by)}</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <AllergyListLayout
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
      className={className}
      isPrintPreview={isPrintPreview}
    >
      <Table className="border-separate border-spacing-y-0.5">
        <TableHeader>
          <TableRow className="rounded-md overflow-hidden bg-gray-100">
            <TableHead className="first:rounded-l-md h-auto py-1 pl-1 pr-0 text-gray-600"></TableHead>
            <TableHead className="h-auto py-1 pl-1 pr-2 text-gray-600">
              {t("allergen")}
            </TableHead>
            <TableHead className="h-auto py-1 px-2 text-gray-600">
              {t("status")}
            </TableHead>
            <TableHead className="h-auto py-1 px-2 text-gray-600">
              {t("criticality")}
            </TableHead>
            <TableHead className="h-auto py-1 px-2 text-gray-600">
              {t("verification")}
            </TableHead>
            <TableHead className="h-auto py-1 px-2 text-gray-600">
              {t("notes")}
            </TableHead>
            <TableHead className="last:rounded-r-md h-auto py-1 px-2 text-gray-600">
              {t("logged_by")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Valid entries */}
          {filteredAllergies
            .filter(
              (allergy) => allergy.verification_status !== "entered_in_error",
            )
            .map((allergy) => (
              <AllergyRow key={allergy.id} allergy={allergy} />
            ))}

          {/* Entered in error entries */}
          {showEnteredInError &&
            filteredAllergies
              .filter(
                (allergy) => allergy.verification_status === "entered_in_error",
              )
              .map((allergy) => (
                <AllergyRow key={allergy.id} allergy={allergy} />
              ))}
        </TableBody>
      </Table>
      {hasEnteredInErrorRecords && !showEnteredInError && (
        <>
          <div className="border-b border-dashed border-gray-200 my-2" />
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowEnteredInError(true)}
              className="text-xs underline text-gray-950"
            >
              {t("view_all")}
            </Button>
          </div>
        </>
      )}
    </AllergyListLayout>
  );
}

const AllergyListLayout = ({
  facilityId,
  patientId,
  encounterId,
  children,
  className,
  isPrintPreview = false,
}: {
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  children: ReactNode;
  className?: string;
  isPrintPreview?: boolean;
}) => {
  return (
    <Card className={cn("border-none rounded-sm", className)}>
      <CardHeader
        className={cn(
          "flex justify-between flex-row",
          !isPrintPreview && "px-4 pt-4 pb-2 ",
          isPrintPreview && "px-0 py-2 ",
        )}
      >
        <CardTitle>{t("allergies")}</CardTitle>
        {facilityId && encounterId && (
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/allergy_intolerance`}
            className="flex items-center gap-1 text-sm hover:text-gray-500 text-gray-950 underline"
          >
            <CareIcon icon="l-edit" className="w-4 h-4" />
            {t("edit")}
          </Link>
        )}
      </CardHeader>
      <CardContent
        className={cn(
          !isPrintPreview && "px-2 pb-2",
          isPrintPreview && "px-0 py-0",
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
};
