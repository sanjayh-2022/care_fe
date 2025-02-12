import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import {
  MEDICATION_STATEMENT_STATUS_STYLES,
  MedicationStatementRead,
} from "@/types/emr/medicationStatement";

interface MedicationStatementListProps {
  patientId: string;
  className?: string;
  isPrintPreview?: boolean;
}

interface MedicationRowProps {
  statement: MedicationStatementRead;
  isEnteredInError?: boolean;
  isPrintPreview?: boolean;
}

function MedicationRow({
  statement,
  isEnteredInError,
  isPrintPreview = false,
}: MedicationRowProps) {
  const { t } = useTranslation();

  return (
    <TableRow
      className={`rounded-md overflow-hidden bg-gray-50 ${
        isEnteredInError ? "opacity-50" : ""
      }`}
    >
      <TableCell className="font-medium first:rounded-l-md">
        {statement.medication.display ?? statement.medication.code}
      </TableCell>
      <TableCell>{statement.dosage_text}</TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`whitespace-nowrap capitalize ${
            MEDICATION_STATEMENT_STATUS_STYLES[statement.status]
          }`}
        >
          {statement.status}
        </Badge>
      </TableCell>
      <TableCell>
        {[statement.effective_period?.start, statement.effective_period?.end]
          .map((date) => formatDateTime(date))
          .join(" - ")}
      </TableCell>
      <TableCell>{statement.reason}</TableCell>
      <TableCell className="max-w-[200px]">
        {statement.note ? (
          <div className="flex items-center gap-2">
            {isPrintPreview ? (
              <span className="text-gray-950">{statement.note}</span>
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
                    {statement.note}
                  </p>
                </PopoverContent>
              </Popover>
            )}
          </div>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="last:rounded-r-md">
        <div className="flex items-center gap-2">
          <Avatar
            name={formatName(statement.created_by)}
            className="w-4 h-4"
            imageUrl={statement.created_by.read_profile_picture_url}
          />
          <span className="text-sm">{formatName(statement.created_by)}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function MedicationStatementList({
  patientId,
  className,
  isPrintPreview = false,
}: MedicationStatementListProps) {
  const { t } = useTranslation();
  const [showEnteredInError, setShowEnteredInError] = useState(isPrintPreview);

  const { data: medications, isLoading } = useQuery({
    queryKey: ["medication_statements", patientId],
    queryFn: query(routes.medicationStatement.list, {
      pathParams: { patientId },
    }),
  });

  if (isLoading) {
    return (
      <Card className={cn("border-none rounded-sm", className)}>
        <CardHeader
          className={cn("px-4 pt-4 pb-2", isPrintPreview && "px-0 py-2")}
        >
          <CardTitle>{t("ongoing_medications")}</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const filteredMedications = medications?.results?.filter(
    (medication) =>
      showEnteredInError || medication.status !== "entered_in_error",
  );

  const hasEnteredInErrorRecords = medications?.results?.some(
    (medication) => medication.status === "entered_in_error",
  );

  if (!filteredMedications?.length) {
    return (
      <Card className={cn("border-none rounded-sm", className)}>
        <CardHeader
          className={cn("px-4 pt-4 pb-2", isPrintPreview && "px-0 py-2")}
        >
          <CardTitle>{t("ongoing_medications")}</CardTitle>
        </CardHeader>
        <CardContent
          className={cn("px-2 pb-3 pt-2", isPrintPreview && "px-0 py-0")}
        >
          <p className="text-gray-500">{t("no_ongoing_medications")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-none rounded-sm", className)}>
      <CardHeader
        className={cn("px-4 pt-4 pb-2", isPrintPreview && "px-0 py-2")}
      >
        <CardTitle>
          {t("ongoing_medications")} ({filteredMedications.length})
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("px-2 pb-2", isPrintPreview && "px-0 py-0")}>
        <Table className="border-separate border-spacing-y-0.5">
          <TableHeader>
            <TableRow className="rounded-md overflow-hidden bg-gray-100">
              <TableHead className="first:rounded-l-md h-auto py-1 px-2 text-gray-600">
                {t("medication")}
              </TableHead>
              <TableHead className="h-auto py-1 px-2 text-gray-600">
                {t("dosage")}
              </TableHead>
              <TableHead className="h-auto py-1 px-2 text-gray-600">
                {t("status")}
              </TableHead>
              <TableHead className="h-auto py-1 px-2 text-gray-600">
                {t("medication_taken_between")}
              </TableHead>
              <TableHead className="h-auto py-1 px-2 text-gray-600">
                {t("reason")}
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
            {[
              ...filteredMedications.filter(
                (medication) => medication.status !== "entered_in_error",
              ),
              ...(showEnteredInError
                ? filteredMedications.filter(
                    (medication) => medication.status === "entered_in_error",
                  )
                : []),
            ].map((statement) => (
              <MedicationRow
                key={statement.id}
                statement={statement}
                isEnteredInError={statement.status === "entered_in_error"}
                isPrintPreview={isPrintPreview}
              />
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
                className="text-xs underline text-gray-500"
              >
                {t("view_all")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
