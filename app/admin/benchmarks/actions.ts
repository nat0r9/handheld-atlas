"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

type ContentStatus =
  | "draft"
  | "published"
  | "archived";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile?.is_admin) {
    redirect("/admin/login");
  }

  return {
    supabase,
    user,
  };
}

function requiredText(
  formData: FormData,
  name: string,
) {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(
  formData: FormData,
  name: string,
) {
  const value = requiredText(formData, name);

  return value.length > 0 ? value : null;
}

function optionalNumber(
  formData: FormData,
  name: string,
) {
  const value = requiredText(formData, name);

  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : null;
}

function getStatus(
  formData: FormData,
): ContentStatus {
  const value = requiredText(
    formData,
    "status",
  );

  if (
    value === "draft" ||
    value === "published" ||
    value === "archived"
  ) {
    return value;
  }

  return "draft";
}

async function getRelatedSlugs(
  supabase: Awaited<
    ReturnType<typeof createClient>
  >,
  gameId: string,
  handheldId: string,
) {
  const [gameResult, handheldResult] =
    await Promise.all([
      supabase
        .from("games")
        .select("slug")
        .eq("id", gameId)
        .single(),

      supabase
        .from("handhelds")
        .select("slug")
        .eq("id", handheldId)
        .single(),
    ]);

  return {
    gameSlug: gameResult.data?.slug ?? null,
    handheldSlug:
      handheldResult.data?.slug ?? null,
    gameError: gameResult.error,
    handheldError: handheldResult.error,
  };
}

function revalidateBenchmarkPages(
  benchmarkId?: string,
  gameSlug?: string | null,
  handheldSlug?: string | null,
) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/benchmarks");
  revalidatePath("/benchmarks");
  revalidatePath("/games");
  revalidatePath("/handhelds");

  if (benchmarkId) {
    revalidatePath(
      `/admin/benchmarks/${benchmarkId}/edit`,
    );
  }

  if (gameSlug) {
    revalidatePath(`/games/${gameSlug}`);
  }

  if (handheldSlug) {
    revalidatePath(
      `/handhelds/${handheldSlug}`,
    );
  }
}

export async function createBenchmark(
  formData: FormData,
) {
  const { supabase, user } =
    await requireAdmin();

  const gameId = requiredText(
    formData,
    "gameId",
  );

  const handheldId = requiredText(
    formData,
    "handheldId",
  );

  const presetId =
    optionalText(formData, "presetId");

  const status = getStatus(formData);

  if (!gameId || !handheldId) {
    redirect(
      "/admin/benchmarks?error=Game%20and%20handheld%20are%20required",
    );
  }

  const averageFps = optionalNumber(
    formData,
    "averageFps",
  );

  const onePercentLow = optionalNumber(
    formData,
    "onePercentLow",
  );

  if (
    averageFps !== null &&
    averageFps < 0
  ) {
    redirect(
      "/admin/benchmarks?error=Average%20FPS%20cannot%20be%20negative",
    );
  }

  if (
    onePercentLow !== null &&
    onePercentLow < 0
  ) {
    redirect(
      "/admin/benchmarks?error=1%25%20low%20cannot%20be%20negative",
    );
  }

  const relatedSlugs =
    await getRelatedSlugs(
      supabase,
      gameId,
      handheldId,
    );

  if (
    relatedSlugs.gameError ||
    !relatedSlugs.gameSlug
  ) {
    redirect(
      "/admin/benchmarks?error=Selected%20game%20was%20not%20found",
    );
  }

  if (
    relatedSlugs.handheldError ||
    !relatedSlugs.handheldSlug
  ) {
    redirect(
      "/admin/benchmarks?error=Selected%20handheld%20was%20not%20found",
    );
  }

  if (presetId) {
    const { data: preset, error: presetError } =
      await supabase
        .from("presets")
        .select("id, game_id, handheld_id")
        .eq("id", presetId)
        .single();

    if (presetError || !preset) {
      redirect(
        "/admin/benchmarks?error=Selected%20preset%20was%20not%20found",
      );
    }

    if (
      preset.game_id !== gameId ||
      preset.handheld_id !== handheldId
    ) {
      redirect(
        "/admin/benchmarks?error=Selected%20preset%20does%20not%20match%20the%20chosen%20game%20and%20handheld",
      );
    }
  }

  const { data: benchmark, error } =
    await supabase
      .from("benchmarks")
      .insert({
        game_id: gameId,
        handheld_id: handheldId,
        preset_id: presetId,
        resolution: optionalText(
          formData,
          "resolution",
        ),
        tdp: optionalText(formData, "tdp"),
        average_fps: averageFps,
        one_percent_low: onePercentLow,
        battery_life: optionalText(
          formData,
          "batteryLife",
        ),
        test_notes: optionalText(
          formData,
          "testNotes",
        ),
        status,
        created_by: user.id,
        published_at:
          status === "published"
            ? new Date().toISOString()
            : null,
      })
      .select("id")
      .single();

  if (error || !benchmark) {
    redirect(
      `/admin/benchmarks?error=${encodeURIComponent(
        error?.message ??
          "Could not create benchmark",
      )}`,
    );
  }

  revalidateBenchmarkPages(
    benchmark.id,
    relatedSlugs.gameSlug,
    relatedSlugs.handheldSlug,
  );

  redirect(
    "/admin/benchmarks?success=Benchmark%20created",
  );
}

export async function updateBenchmark(
  formData: FormData,
) {
  const { supabase } = await requireAdmin();

  const benchmarkId = requiredText(
    formData,
    "benchmarkId",
  );

  const gameId = requiredText(
    formData,
    "gameId",
  );

  const handheldId = requiredText(
    formData,
    "handheldId",
  );

  const presetId =
    optionalText(formData, "presetId");

  const status = getStatus(formData);

  const editPath =
    `/admin/benchmarks/${benchmarkId}/edit`;

  if (!benchmarkId) {
    redirect(
      "/admin/benchmarks?error=Missing%20benchmark%20ID",
    );
  }

  if (!gameId || !handheldId) {
    redirect(
      `${editPath}?error=Game%20and%20handheld%20are%20required`,
    );
  }

  const averageFps = optionalNumber(
    formData,
    "averageFps",
  );

  const onePercentLow = optionalNumber(
    formData,
    "onePercentLow",
  );

  if (
    averageFps !== null &&
    averageFps < 0
  ) {
    redirect(
      `${editPath}?error=Average%20FPS%20cannot%20be%20negative`,
    );
  }

  if (
    onePercentLow !== null &&
    onePercentLow < 0
  ) {
    redirect(
      `${editPath}?error=1%25%20low%20cannot%20be%20negative`,
    );
  }

  const {
    data: currentBenchmark,
    error: currentError,
  } = await supabase
    .from("benchmarks")
    .select(`
      published_at,
      games (
        slug
      ),
      handhelds (
        slug
      )
    `)
    .eq("id", benchmarkId)
    .single();

  if (
    currentError ||
    !currentBenchmark
  ) {
    redirect(
      "/admin/benchmarks?error=Benchmark%20not%20found",
    );
  }

  const relatedSlugs =
    await getRelatedSlugs(
      supabase,
      gameId,
      handheldId,
    );

  if (
    relatedSlugs.gameError ||
    !relatedSlugs.gameSlug
  ) {
    redirect(
      `${editPath}?error=Selected%20game%20was%20not%20found`,
    );
  }

  if (
    relatedSlugs.handheldError ||
    !relatedSlugs.handheldSlug
  ) {
    redirect(
      `${editPath}?error=Selected%20handheld%20was%20not%20found`,
    );
  }

  if (presetId) {
    const { data: preset, error: presetError } =
      await supabase
        .from("presets")
        .select("id, game_id, handheld_id")
        .eq("id", presetId)
        .single();

    if (presetError || !preset) {
      redirect(
        `${editPath}?error=Selected%20preset%20was%20not%20found`,
      );
    }

    if (
      preset.game_id !== gameId ||
      preset.handheld_id !== handheldId
    ) {
      redirect(
        `${editPath}?error=Selected%20preset%20does%20not%20match%20the%20chosen%20game%20and%20handheld`,
      );
    }
  }

  const publishedAt =
    status === "published"
      ? currentBenchmark.published_at ??
        new Date().toISOString()
      : null;

  const { error } = await supabase
    .from("benchmarks")
    .update({
      game_id: gameId,
      handheld_id: handheldId,
      preset_id: presetId,
      resolution: optionalText(
        formData,
        "resolution",
      ),
      tdp: optionalText(formData, "tdp"),
      average_fps: averageFps,
      one_percent_low: onePercentLow,
      battery_life: optionalText(
        formData,
        "batteryLife",
      ),
      test_notes: optionalText(
        formData,
        "testNotes",
      ),
      status,
      published_at: publishedAt,
    })
    .eq("id", benchmarkId);

  if (error) {
    redirect(
      `${editPath}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  const oldGameSlug = Array.isArray(
    currentBenchmark.games,
  )
    ? currentBenchmark.games[0]?.slug
    : currentBenchmark.games?.slug;

  const oldHandheldSlug = Array.isArray(
    currentBenchmark.handhelds,
  )
    ? currentBenchmark.handhelds[0]?.slug
    : currentBenchmark.handhelds?.slug;

  revalidateBenchmarkPages(
    benchmarkId,
    relatedSlugs.gameSlug,
    relatedSlugs.handheldSlug,
  );

  if (
    oldGameSlug &&
    oldGameSlug !== relatedSlugs.gameSlug
  ) {
    revalidatePath(`/games/${oldGameSlug}`);
  }

  if (
    oldHandheldSlug &&
    oldHandheldSlug !==
      relatedSlugs.handheldSlug
  ) {
    revalidatePath(
      `/handhelds/${oldHandheldSlug}`,
    );
  }

  redirect(
    `${editPath}?success=Benchmark%20updated`,
  );
}

export async function deleteBenchmark(
  formData: FormData,
) {
  const { supabase } = await requireAdmin();

  const benchmarkId = requiredText(
    formData,
    "benchmarkId",
  );

  if (!benchmarkId) {
    redirect(
      "/admin/benchmarks?error=Missing%20benchmark%20ID",
    );
  }

  const {
    data: benchmark,
    error: lookupError,
  } = await supabase
    .from("benchmarks")
    .select(`
      games (
        slug
      ),
      handhelds (
        slug
      )
    `)
    .eq("id", benchmarkId)
    .single();

  if (lookupError || !benchmark) {
    redirect(
      "/admin/benchmarks?error=Benchmark%20not%20found",
    );
  }

  const { error } = await supabase
    .from("benchmarks")
    .delete()
    .eq("id", benchmarkId);

  if (error) {
    redirect(
      `/admin/benchmarks?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  const gameSlug = Array.isArray(
    benchmark.games,
  )
    ? benchmark.games[0]?.slug
    : benchmark.games?.slug;

  const handheldSlug = Array.isArray(
    benchmark.handhelds,
  )
    ? benchmark.handhelds[0]?.slug
    : benchmark.handhelds?.slug;

  revalidateBenchmarkPages(
    benchmarkId,
    gameSlug,
    handheldSlug,
  );

  redirect(
    "/admin/benchmarks?success=Benchmark%20deleted",
  );
}