import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "raviger";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { Encounter, EncounterPriority } from "@/types/emr/encounter";

interface EncounterListProps {
  encounters?: Encounter[];
  facilityId?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "planned":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "stat":
      return "bg-red-100 text-red-800";
    case "urgent":
      return "bg-orange-100 text-orange-800";
    case "asap":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const buildQueryParams = (
  status?: string,
  facilityId?: string,
  encounterClass?: string,
  priority?: string,
) => {
  const params: Record<string, string | undefined> = {};
  if (facilityId) {
    params.facility = facilityId;
  }
  if (status && ["live", "ended"].includes(status)) {
    params.live = status === "live" ? "true" : undefined;
  } else if (status) {
    params.status = status;
  }
  if (encounterClass) {
    params.encounter_class = encounterClass;
  }
  if (priority) {
    params.priority = priority;
  }
  return params;
};

function EmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon="l-folder-open" className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No encounters found</h3>
      <p className="text-sm text-gray-500 mb-4">
        Try adjusting your filters or create a new encounter
      </p>
    </Card>
  );
}

export function EncounterList({
  encounters: propEncounters,
  facilityId,
}: EncounterListProps) {
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    cacheBlacklist: ["name", "encounter_id", "external_identifier"],
  });
  const {
    status,
    encounter_class: encounterClass,
    priority,
    name,
    encounter_id,
    external_identifier,
  } = qParams;
  const handleFieldChange = () => {
    updateQuery({
      status,
      encounter_class: encounterClass,
      priority,
      name: undefined,
      encounter_id: undefined,
      external_identifier: undefined,
    });
  };

  const handleSearch = useCallback(
    (key: string, value: string) => {
      updateQuery({
        ...{
          status,
          encounter_class: encounterClass,
          priority,
        },
        [key]: value || undefined,
      });
    },
    [status, encounterClass, priority, updateQuery],
  );

  const { data: queryEncounters, isLoading } = useQuery<
    PaginatedResponse<Encounter>
  >({
    queryKey: ["encounters", facilityId, qParams],
    queryFn: query.debounced(routes.encounter.list, {
      queryParams: {
        ...buildQueryParams(status, facilityId, encounterClass, priority),
        name,
        external_identifier,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
      },
    }),
    enabled: !propEncounters && !encounter_id,
  });

  const { data: queryEncounter } = useQuery<Encounter>({
    queryKey: ["encounter", encounter_id],
    queryFn: query(routes.encounter.get, {
      pathParams: { id: encounter_id },
      queryParams: {
        facility: facilityId,
      },
    }),
    enabled: !!encounter_id,
  });
  const searchOptions = [
    {
      key: "name",
      label: "Patient Name",
      type: "text" as const,
      placeholder: "Search by patient name",
      value: name || "",
    },
    {
      key: "encounter_id",
      label: "Encounter ID",
      type: "text" as const,
      placeholder: "Search by encounter ID",
      value: encounter_id || "",
    },
    {
      key: "external_identifier",
      label: "External ID",
      type: "text" as const,
      placeholder: "Search by external ID",
      value: external_identifier || "",
    },
  ];

  const encounters =
    propEncounters ||
    queryEncounters?.results ||
    (queryEncounter ? [queryEncounter] : []);

  const { t } = useTranslation();

  return (
    <Page title={t("encounters")}>
      <div className="space-y-4 mt-2 flex flex-col">
        <div className="rounded-lg border bg-card shadow-sm flex flex-col">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 min-w-[120px] justify-start",
                        (name || encounter_id || external_identifier) &&
                          "bg-primary/10 text-primary hover:bg-primary/20",
                      )}
                    >
                      <CareIcon icon="l-search" className="mr-2 h-4 w-4" />
                      {name || encounter_id || external_identifier ? (
                        <span className="truncate">
                          {name || encounter_id || external_identifier}
                        </span>
                      ) : (
                        t("search")
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[20rem] p-3"
                    align="start"
                    onEscapeKeyDown={(event) => event.preventDefault()}
                  >
                    <div className="space-y-4">
                      <h4 className="font-medium leading-none">
                        {t("search_encounters")}
                      </h4>
                      <SearchByMultipleFields
                        id="encounter-search"
                        options={searchOptions}
                        initialOptionIndex={Math.max(
                          searchOptions.findIndex(
                            (option) => option.value !== "",
                          ),
                          0,
                        )}
                        onFieldChange={handleFieldChange}
                        onSearch={handleSearch}
                        className="w-full border-none shadow-none"
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                <Select
                  value={priority || "all"}
                  onValueChange={(value) => {
                    updateQuery({
                      status,
                      encounter_class: encounterClass,
                      priority:
                        value === "all"
                          ? undefined
                          : (value as EncounterPriority),
                    });
                  }}
                >
                  <SelectTrigger className="h-8 w-[120px]">
                    <SelectValue placeholder={t("priority")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="asap">
                      <div className="flex items-center">
                        <span className="mr-2">🟡</span> ASAP
                      </div>
                    </SelectItem>
                    <SelectItem value="callback_results">
                      <div className="flex items-center">
                        <span className="mr-2">🔵</span> Callback Results
                      </div>
                    </SelectItem>
                    <SelectItem value="callback_for_scheduling">
                      <div className="flex items-center">
                        <span className="mr-2">🟣</span> Callback for Scheduling
                      </div>
                    </SelectItem>
                    <SelectItem value="elective">
                      <div className="flex items-center">
                        <span className="mr-2">🟤</span> Elective
                      </div>
                    </SelectItem>
                    <SelectItem value="emergency">
                      <div className="flex items-center">
                        <span className="mr-2">🔴</span> Emergency
                      </div>
                    </SelectItem>
                    <SelectItem value="preop">
                      <div className="flex items-center">
                        <span className="mr-2">🟠</span> Pre-op
                      </div>
                    </SelectItem>
                    <SelectItem value="as_needed">
                      <div className="flex items-center">
                        <span className="mr-2">⚫️</span> As Needed
                      </div>
                    </SelectItem>
                    <SelectItem value="routine">
                      <div className="flex items-center">
                        <span className="mr-2">⚪️</span> Routine
                      </div>
                    </SelectItem>
                    <SelectItem value="rush_reporting">
                      <div className="flex items-center">
                        <span className="mr-2">🟤</span> Rush Reporting
                      </div>
                    </SelectItem>
                    <SelectItem value="stat">
                      <div className="flex items-center">
                        <span className="mr-2">🔴</span> Stat
                      </div>
                    </SelectItem>
                    <SelectItem value="timing_critical">
                      <div className="flex items-center">
                        <span className="mr-2">🟡</span> Timing Critical
                      </div>
                    </SelectItem>
                    <SelectItem value="use_as_directed">
                      <div className="flex items-center">
                        <span className="mr-2">🔵</span> Use as Directed
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center">
                        <span className="mr-2">🟠</span> Urgent
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter - Mobile */}
                <div className="md:hidden">
                  <Select
                    value={status || "all"}
                    onValueChange={(value) => {
                      updateQuery({
                        ...{ encounter_class: encounterClass, priority },
                        status: value === "all" ? undefined : value,
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="planned">
                        <div className="flex items-center">
                          <CareIcon
                            icon="l-calender"
                            className="mr-2 h-4 w-4"
                          />
                          Planned
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center">
                          <CareIcon icon="l-spinner" className="mr-2 h-4 w-4" />
                          In Progress
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center">
                          <CareIcon icon="l-check" className="mr-2 h-4 w-4" />
                          Completed
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center">
                          <CareIcon icon="l-x" className="mr-2 h-4 w-4" />
                          Cancelled
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Class Filter - Mobile */}
                <div className="md:hidden">
                  <Select
                    value={encounterClass || "all"}
                    onValueChange={(value) => {
                      updateQuery({
                        status,
                        priority,
                        encounter_class: value === "all" ? undefined : value,
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="imp">
                        <div className="flex items-center">
                          <CareIcon
                            icon="l-hospital"
                            className="mr-2 h-4 w-4"
                          />
                          Inpatient
                        </div>
                      </SelectItem>
                      <SelectItem value="amb">
                        <div className="flex items-center">
                          <CareIcon icon="l-user" className="mr-2 h-4 w-4" />
                          Ambulatory
                        </div>
                      </SelectItem>
                      <SelectItem value="obsenc">
                        <div className="flex items-center">
                          <CareIcon icon="l-eye" className="mr-2 h-4 w-4" />
                          Observation
                        </div>
                      </SelectItem>
                      <SelectItem value="emer">
                        <div className="flex items-center">
                          <CareIcon
                            icon="l-ambulance"
                            className="mr-2 h-4 w-4"
                          />
                          Emergency
                        </div>
                      </SelectItem>
                      <SelectItem value="vr">
                        <div className="flex items-center">
                          <CareIcon icon="l-video" className="mr-2 h-4 w-4" />
                          Virtual
                        </div>
                      </SelectItem>
                      <SelectItem value="hh">
                        <div className="flex items-center">
                          <CareIcon icon="l-home" className="mr-2 h-4 w-4" />
                          Home Health
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Filter - Desktop */}
              <div className="hidden md:flex items-center">
                <Tabs value={status || "all"} className="w-full">
                  <TabsList className="bg-transparent p-0 h-8">
                    <div className="flex flex-wrap">
                      <TabsTrigger
                        value="all"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: undefined,
                          })
                        }
                      >
                        {t("all")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="planned"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: "planned",
                          })
                        }
                      >
                        <CareIcon icon="l-calender" className="mr-2 h-4 w-4" />
                        {t("encounter_status__planned")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="in_progress"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: "in_progress",
                          })
                        }
                      >
                        <CareIcon icon="l-spinner" className="mr-2 h-4 w-4" />
                        {t("encounter_class__in_progress")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="discharged"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: "discharged",
                          })
                        }
                      >
                        <CareIcon icon="l-home" className="mr-2 h-4 w-4" />
                        {t("discharge")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="completed"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: "completed",
                          })
                        }
                      >
                        <CareIcon icon="l-check" className="mr-2 h-4 w-4" />
                        {t("completed")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="cancelled"
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        onClick={() =>
                          updateQuery({
                            ...{ encounter_class: encounterClass, priority },
                            status: "cancelled",
                          })
                        }
                      >
                        <CareIcon icon="l-x" className="mr-2 h-4 w-4" />
                        {t("cancelled")}
                      </TabsTrigger>
                    </div>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Separator className="hidden md:block" />

            {/* Class Filter - Desktop */}
            <div className="hidden md:block p-4">
              <Tabs value={encounterClass || "all"} className="w-full">
                <TabsList className="bg-transparent p-0 h-8">
                  <div className="flex flex-wrap">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: undefined,
                        })
                      }
                    >
                      {t("all")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="imp"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "imp",
                        })
                      }
                    >
                      <CareIcon icon="l-hospital" className="mr-2 h-4 w-4" />
                      {t("encounter_class__imp")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="amb"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "amb",
                        })
                      }
                    >
                      <CareIcon icon="l-user" className="mr-2 h-4 w-4" />
                      {t("encounter_class__amb")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="obsenc"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "obsenc",
                        })
                      }
                    >
                      <CareIcon icon="l-eye" className="mr-2 h-4 w-4" />
                      {t("encounter_class__obsenc")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="emer"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "emer",
                        })
                      }
                    >
                      <CareIcon icon="l-ambulance" className="mr-2 h-4 w-4" />
                      {t("emergency")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="vr"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "vr",
                        })
                      }
                    >
                      <CareIcon icon="l-video" className="mr-2 h-4 w-4" />
                      {t("encounter_class__vr")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="hh"
                      className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      onClick={() =>
                        updateQuery({
                          status,
                          priority,
                          encounter_class: "hh",
                        })
                      }
                    >
                      <CareIcon icon="l-home" className="mr-2 h-4 w-4" />
                      {t("encounter_class__hh")}
                    </TabsTrigger>
                  </div>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div
          className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          data-cy="encounter-list-cards"
        >
          {isLoading ? (
            <CardGridSkeleton count={6} />
          ) : encounters.length === 0 ? (
            <div className="col-span-full">
              <EmptyState />
            </div>
          ) : (
            <>
              {encounters.map((encounter: Encounter) => (
                <Card
                  key={encounter.id}
                  className="hover:shadow-lg transition-shadow group"
                >
                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/facility/${facilityId}/patient/${encounter.patient.id}`}
                        className="hover:text-primary"
                      >
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {encounter.patient.name}
                        </CardTitle>
                      </Link>
                    </div>
                    <CardDescription className="flex items-center">
                      <CareIcon icon="l-clock" className="mr-2 h-4 w-4" />
                      {encounter.period.start &&
                        format(new Date(encounter.period.start), "PPp")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="">
                    <div className="flex flex-col space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={getStatusColor(encounter.status)}
                          variant="outline"
                        >
                          {t(`encounter_status__${encounter.status}`)}
                        </Badge>
                        <Badge
                          className="bg-gray-100 text-gray-800"
                          variant="outline"
                        >
                          {t(`encounter_class__${encounter.encounter_class}`)}
                        </Badge>
                        <Badge
                          className={getPriorityColor(encounter.priority)}
                          variant="outline"
                        >
                          {t(`encounter_priority__${encounter.priority}`)}
                        </Badge>
                      </div>
                      <Separator className="my-2" />
                      <Link
                        href={`/facility/${facilityId}/encounter/${encounter.id}/updates`}
                        className="text-sm text-primary hover:underline text-right flex items-center justify-end group-hover:translate-x-1 transition-transform"
                      >
                        View Details
                        <CareIcon
                          icon="l-arrow-right"
                          className="ml-1 h-4 w-4"
                        />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {queryEncounters?.count &&
                queryEncounters.count > resultsPerPage && (
                  <div className="col-span-full">
                    <Pagination totalCount={queryEncounters.count} />
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}
