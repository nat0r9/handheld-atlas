import {
  PUBLIC_CONTENT_RESOURCES,
  publicApiJson,
  publicApiOptions,
} from "../../../lib/api/public-content";
import { absoluteUrl } from "../../../lib/site";

export const dynamic = "force-static";

export function GET() {
  return publicApiJson({
    name: "HandheldAtlas Public API",
    version: "v1",
    documentation: {
      pagination:
        "Collection endpoints accept page (1-1000) and limit (1-100).",
      visibility:
        "Only published records and explicitly public fields are returned.",
      cache:
        "Responses may be cached for 60 seconds and served stale while revalidating for 5 minutes.",
    },
    resources: PUBLIC_CONTENT_RESOURCES.map(
      (resource) => ({
        name: resource,
        collection: absoluteUrl(
          `/api/v1/${resource}`,
        ),
        detail:
          resource === "presets"
            ? absoluteUrl(
                `/api/v1/${resource}/{id}`,
              )
            : absoluteUrl(
                `/api/v1/${resource}/{slug}`,
              ),
      }),
    ),
  });
}

export function OPTIONS() {
  return publicApiOptions();
}
