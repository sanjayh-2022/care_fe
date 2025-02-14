import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";

import CreateFacilityOrganizationSheet from "./components/CreateFacilityOrganizationSheet";
import FacilityOrganizationLayout from "./components/FacilityOrganizationLayout";

interface Props {
  id: string;
  facilityId: string;
}

function OrganizationCard({
  org,
}: {
  org: FacilityOrganization;
  facilityId: string;
}) {
  const { t } = useTranslation();

  return (
    <Card key={org.id}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap">
            <div className="space-y-1 mb-2">
              <h3 className="text-lg font-semibold">{org.name}</h3>
              <div className="flex items-center gap-2 capitalize">
                <Badge
                  variant="primary"
                  className=" border border-transparent text-indigo-800 bg-indigo-100 px-2 py-1"
                >
                  {org.org_type}
                </Badge>
              </div>
            </div>
            <Button variant="white" size="sm" className="font-semibold" asChild>
              <Link href={`/departments/${org.id}`}>{t("see_details")}</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FacilityOrganizationView({ id, facilityId }: Props) {
  const { t } = useTranslation();
  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 12,
    cacheBlacklist: ["username"],
  });
  const [searchQuery, setSearchQuery] = useState("");

  const { data: children, isLoading } = useQuery({
    queryKey: [
      "facilityOrganization",
      "list",
      facilityId,
      id,
      qParams.page,
      resultsPerPage,
      searchQuery,
    ],
    queryFn: query.debounced(routes.facilityOrganization.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: id,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        limit: resultsPerPage,
        name: searchQuery || undefined,
      },
    }),
  });

  return (
    <FacilityOrganizationLayout id={id} facilityId={facilityId}>
      <div className="space-y-6 mx-auto max-w-4xl">
        <div className="flex flex-col lg:flex-row justify-between item-start lg:items-center  gap-4">
          <div className="flex flex-col items-start md:flex-row sm:items-center gap-4 w-full lg:justify-between">
            <div className="w-full lg:w-1/3 relative">
              <div className="relative">
                <CareIcon
                  icon="l-search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4"
                />
                <Input
                  placeholder={t("search_by_department_team_name")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  className="w-full pl-8"
                />
              </div>
            </div>
            <div className="w-auto">
              <CreateFacilityOrganizationSheet
                facilityId={facilityId}
                parentId={id}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardGridSkeleton count={6} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {children?.results?.length ? (
                children.results.map((org) => (
                  <OrganizationCard
                    key={org.id}
                    org={org}
                    facilityId={facilityId}
                  />
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="p-6 text-center text-gray-500">
                    {t("no_departments_teams_found")}
                  </CardContent>
                </Card>
              )}
            </div>
            {children && children.count > resultsPerPage && (
              <div className="flex justify-center">
                <Pagination totalCount={children.count} />
              </div>
            )}
          </div>
        )}
      </div>
    </FacilityOrganizationLayout>
  );
}
