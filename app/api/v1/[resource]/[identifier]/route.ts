import {
  createPublicContentClient,
  getPublicContentConfig,
  isPublicContentResource,
  publicApiError,
  publicApiJson,
  publicApiOptions,
} from "../../../../../lib/api/public-content";

export const dynamic = "force-dynamic";

interface DetailRouteContext {
  params: Promise<{
    resource: string;
    identifier: string;
  }>;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: DetailRouteContext,
) {
  const {
    resource,
    identifier,
  } = await params;

  if (!isPublicContentResource(resource)) {
    return publicApiError(
      404,
      "resource_not_found",
      "That public API resource does not exist.",
    );
  }

  const config =
    getPublicContentConfig(resource);

  if (
    config.identifier === "id" &&
    !uuidPattern.test(identifier)
  ) {
    return publicApiError(
      400,
      "invalid_identifier",
      "A valid UUID is required for this resource.",
    );
  }

  if (
    config.identifier === "slug" &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      identifier,
    )
  ) {
    return publicApiError(
      400,
      "invalid_identifier",
      "A valid lowercase content slug is required.",
    );
  }

  try {
    const supabase =
      createPublicContentClient();
    const { data, error } = await supabase
      .from(config.table)
      .select(config.detailSelect)
      .eq("status", "published")
      .eq(config.identifier, identifier)
      .maybeSingle();

    if (error) {
      console.error(
        `Public API ${resource} detail query failed:`,
        error.message,
      );

      return publicApiError(
        500,
        "content_unavailable",
        "Published content is temporarily unavailable.",
      );
    }

    if (!data) {
      return publicApiError(
        404,
        "content_not_found",
        "No published content matches that identifier.",
      );
    }

    return publicApiJson({
      data,
    });
  } catch (error) {
    console.error(
      `Public API ${resource} detail failed:`,
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
