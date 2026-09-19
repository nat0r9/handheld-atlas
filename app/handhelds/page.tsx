import { assertRead } from "../../lib/catalog/read";
export const revalidate = 600;
import HandheldsCatalog from "../../components/HandheldsCatalog";
import { createClient } from "../../lib/supabase/public";

export interface PublicHandheld {
  id: string;
  name: string;
  slug: string;
  manufacturer: string;
  deviceStatus: string;
  operatingSystem: string | null;
  processor: string | null;
  memory: string | null;
  storage: string | null;
  displaySize: string | null;
  resolution: string | null;
  refreshRate: string | null;
  battery: string | null;
  weight: string | null;
  imageUrl: string | null;
  tagline: string | null;
}

export default async function HandheldsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("handhelds")
    .select(
      "id, name, slug, manufacturer, device_status, operating_system, processor, memory, storage, display_size, resolution, refresh_rate, battery, weight, image_url, tagline",
    )
    .eq("status", "published")
    .order("name", {
      ascending: true,
    });

  assertRead(error, "handhelds");
  const handhelds: PublicHandheld[] = (data ?? []).map(
    (handheld) => ({
      id: handheld.id,
      name: handheld.name,
      slug: handheld.slug,
      manufacturer: handheld.manufacturer,
      deviceStatus: handheld.device_status,
      operatingSystem: handheld.operating_system,
      processor: handheld.processor,
      memory: handheld.memory,
      storage: handheld.storage,
      displaySize: handheld.display_size,
      resolution: handheld.resolution,
      refreshRate: handheld.refresh_rate,
      battery: handheld.battery,
      weight: handheld.weight,
      imageUrl: handheld.image_url,
      tagline: handheld.tagline,
    }),
  );

  return (
    <HandheldsCatalog
      handhelds={handhelds}
      databaseError={null}
    />
  );
}