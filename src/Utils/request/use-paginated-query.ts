import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import {
  ApiCallOptions,
  ApiRoute,
  PaginatedResponse,
} from "@/Utils/request/types";

export default function usePaginatedQuery<
  Route extends ApiRoute<unknown, unknown>,
>(route: Route, options?: ApiCallOptions<Route> & { enabled?: boolean }) {
  const { data, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["paginated", route.path, options?.queryParams],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(route, {
        pathParams: options?.pathParams,
        queryParams: {
          ...options?.queryParams,
          limit: RESULTS_PER_PAGE_LIMIT,
          offset: pageParam,
        },
      })({ signal });
      return response as PaginatedResponse<Route["TRes"]>;
    },
    enabled: options?.enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * RESULTS_PER_PAGE_LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
  });

  useEffect(() => {
    if (hasNextPage && fetchNextPage && options?.enabled) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, data, options?.enabled]);

  return {
    data: data?.pages.flatMap((page) => page.results),
    paginatedResults: data,
    isCompleted: !hasNextPage,
  };
}
