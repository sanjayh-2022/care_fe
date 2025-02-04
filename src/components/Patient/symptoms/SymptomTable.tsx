import { t } from "i18next";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";

import { Symptom } from "@/types/emr/symptom/symptom";

export const getStatusBadgeStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "resolved":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "recurrence":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

interface SymptomTableProps {
  symptoms: Symptom[];
}

export function SymptomTable({ symptoms }: SymptomTableProps) {
  return (
    <Table className="border-separate border-spacing-y-0.5">
      <TableHeader>
        <TableRow className="rounded-md overflow-hidden bg-gray-100">
          <TableHead className="first:rounded-l-md h-auto  py-1 px-2  text-gray-600">
            {t("symptom")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("severity")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("status")}
          </TableHead>
          <TableHead className="h-auto  py-1 px-2  text-gray-600">
            {t("verification")}
          </TableHead>
          <TableHead className="last:rounded-r-md h-auto  py-1 px-2  text-gray-600">
            {t("logged_by")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {symptoms.map((symptom) => (
          <TableRow
            key={symptom.id}
            className={`rounded-md overflow-hidden bg-gray-50 ${
              symptom.verification_status === "entered_in_error"
                ? "opacity-50"
                : ""
            }`}
          >
            <TableCell className="font-medium first:rounded-l-md">
              {symptom.code.display}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`whitespace-nowrap ${getStatusBadgeStyle(
                  symptom.clinical_status,
                )}`}
              >
                {t(symptom.clinical_status)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`whitespace-nowrap ${getStatusBadgeStyle(
                  symptom.clinical_status,
                )}`}
              >
                {t(symptom.clinical_status)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  symptom.verification_status === "entered_in_error"
                    ? "destructive"
                    : "outline"
                }
                className="whitespace-nowrap capitalize"
              >
                {t(symptom.verification_status)}
              </Badge>
            </TableCell>
            <TableCell className="last:rounded-r-md">
              <div className="flex items-center gap-2">
                <Avatar
                  name={symptom.created_by.username}
                  className="w-4 h-4"
                  imageUrl={symptom.created_by.profile_picture_url}
                />
                <span className="text-sm">{symptom.created_by.username}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
