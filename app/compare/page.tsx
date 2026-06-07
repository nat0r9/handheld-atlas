import CompareHandhelds, {
  type CompareHandheld,
} from "../../components/CompareHandhelds";
import { createClient } from "../../lib/supabase/server";

interface DatabaseHandheld {
  id: string;
  name: string;
  slug: string;
  manufacturer: string;
  device_status: string;
  operating_system: string | null;
  processor: string | null;
  memory: string | null;
  storage: string | null;
  display_size: string | null;
  resolution: string | null;
  refresh_rate: string | null;
  battery: string | null;
  weight: string | null;
  image_url: string | null;
  tagline: string | null;
}

export default async function ComparePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("handhelds")
    .select(`
      id,
      name,
      slug,
      manufacturer,
      device_status,
      operating_system,
      processor,
      memory,
      storage,
      display_size,
      resolution,
      refresh_rate,
      battery,
      weight,
      image_url,
      tagline
    `)
    .eq("status", "published")
    .order("name", {
      ascending: true,
    });

  const databaseHandhelds =
    (data ?? []) as DatabaseHandheld[];

  const handhelds: CompareHandheld[] =
    databaseHandhelds.map((handheld) => ({
      id: handheld.id,
      name: handheld.name,
      slug: handheld.slug,
      manufacturer: handheld.manufacturer,
      deviceStatus: handheld.device_status,
      operatingSystem:
        handheld.operating_system,
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
    }));

  return (
    <CompareHandhelds
      handhelds={handhelds}
      databaseError={error?.message ?? null}
    />
  );
}