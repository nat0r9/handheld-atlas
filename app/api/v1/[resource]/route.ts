import {
  PublicApiInputError,
  createPublicContentClient,
  getPublicContentConfig,
  isPublicContentResource,
  parsePublicApiPagination,
  publicApiError,
  publicApiJson,
  publicApiOptions,
} from "../../../../lib/api/public-content";

export const dynamic = "force-dynamic";

interface ResourceRouteContext {
  params: Promise<{
    resource: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: ResourceRouteContext,
) {
  const { resource } = await params;

  if (!isPublicContentResource(resource)) {
    return publicApiError(
      404,
      "resource_not_found",
      "That public API resource does not exist.",
    );
  }

  try {
    const pagination =
      parsePublicApiPagination(request);
    const config =
      getPublicContentConfig(resource);
    const supabase =
      createPublicContentClient();

    const {
      data,
      error,
      count,
    } = await supabase
      .from(config.table)
      .select(config.listSelect, {
        count: "exact",
      })
      .eq("status", "published")
      .order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      .order("id", {
        ascending: false,
      })
      .range(
        pagination.from,
        pagination.to,
      );

    if (error) {
      console.error(
        `Public API ${resource} query failed:`,
        error.message,
      );

      return publicApiError(
        500,
        "content_unavailable",
        "Published content is temporarily unavailable.",
      );
    }

    const total = count ?? 0;

    return publicApiJson({
      data: data ?? [],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages:
          total === 0
            ? 0
            : Math.ceil(
                total / pagination.limit,
              ),
      },
    });
  } catch (error) {
    if (error instanceof PublicApiInputError) {
      return publicApiError(
        400,
        "invalid_pagination",
        error.message,
      );
    }

    console.error(
      `Public API ${resource} failed:`,
      error instanceof Error
        ? error.message
        : "Unknown error",
    );

    return publicApiError(
      500,
      "content_unavailable",
      "Published content is temporarily unavailable.",
    );
  }
}

export function OPTIONS() {
  return publicApiOptions();
}
