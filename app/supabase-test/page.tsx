import { createClient } from "../../lib/supabase/server";

export default async function SupabaseTestPage() {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("games")
    .select("*", {
      count: "exact",
      head: true,
    });

  const isConnected = !error;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
          Database Test
        </p>

        <h1 className="mt-4 text-5xl font-black">
          Supabase connection
        </h1>

        <div
          className={`mt-10 rounded-3xl border p-8 ${
            isConnected
              ? "border-green-500/30 bg-green-500/10"
              : "border-red-500/30 bg-red-500/10"
          }`}
        >
          <p
            className={`text-sm font-black uppercase tracking-[0.2em] ${
              isConnected
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {isConnected
              ? "Connection successful"
              : "Connection failed"}
          </p>

          {isConnected ? (
            <>
              <h2 className="mt-4 text-3xl font-black">
                HandheldAtlas sees Supabase.
              </h2>

              <p className="mt-3 text-slate-300">
                Published games visible to the current visitor:
                {" "}
                <strong>{count ?? 0}</strong>
              </p>

              <p className="mt-3 text-sm text-slate-400">
                Zero is correct right now because the new database
                does not contain published games yet.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-3xl font-black">
                The database request failed.
              </h2>

              <p className="mt-4 break-words text-red-200">
                {error.message}
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}