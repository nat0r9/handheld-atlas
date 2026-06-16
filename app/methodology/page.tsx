import Link from "next/link";
import JsonLd from "../../components/JsonLd";
import { absoluteUrl, createPageMetadata, siteConfig } from "../../lib/site";

export const metadata = createPageMetadata({
  title: "How HandheldAtlas Tests and Scores Data",
  description:
    "Learn how HandheldAtlas separates editorial scores, measured benchmarks, preset confidence and community signals.",
  pathname: "/methodology",
  type: "article",
});

const principles = [
  {
    title: "Match the target",
    text: "A result only means something when the game, handheld, resolution, power target and important settings are known. We avoid treating a loose FPS number as holy scripture.",
  },
  {
    title: "Separate evidence",
    text: "Atlas Score, community game ratings, preset upvotes, Worked for me confirmations and Atlas Verified are different signals. They are shown separately because mixing them into one mystery number would be bullshit.",
  },
  {
    title: "Explain the trade-off",
    text: "A useful preset says what it targets, why settings changed and what the player gives up in image quality, latency, battery life or stability.",
  },
  {
    title: "Keep weak data visible",
    text: "Missing measurements and early community samples are labelled instead of being polished into fake certainty. Confidence should grow with evidence, not marketing volume.",
  },
];

const signals = [
  {
    name: "Atlas Score",
    owner: "Editorial",
    purpose:
      "A curated compatibility and handheld-experience score for a game. It is not the same as the community's enjoyment rating.",
  },
  {
    name: "Atlas Confidence",
    owner: "Evidence model",
    purpose:
      "Scores how complete and reproducible a preset is using test targets, FPS data, settings detail, explanations, verification and community proof.",
  },
  {
    name: "Community rating",
    owner: "Players",
    purpose:
      "A one-rating-per-account opinion score for games or presets. It measures sentiment, not laboratory certainty.",
  },
  {
    name: "Worked for me",
    owner: "Matching users",
    purpose:
      "A confirmation that a preset worked on the listed target. Users should only confirm after matching the handheld, TDP and resolution.",
  },
  {
    name: "Atlas Verified",
    owner: "Editorial review",
    purpose:
      "A staff-reviewed signal that the preset contains a coherent target, usable settings and credible supporting data.",
  },
];

const methodologyJsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "How HandheldAtlas Tests and Scores Data",
  description:
    "HandheldAtlas methodology for benchmarks, presets, confidence scoring and community proof.",
  url: absoluteUrl("/methodology"),
  author: {
    "@id": `${siteConfig.url}/#organization`,
  },
  publisher: {
    "@id": `${siteConfig.url}/#organization`,
  },
  mainEntityOfPage: absoluteUrl("/methodology"),
};

export default function MethodologyPage() {
  return (
    <main className="atlas-page min-h-screen pb-16 text-white">
      <JsonLd data={methodologyJsonLd} />

      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(239,35,60,0.18),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(24,215,255,0.13),transparent_32%),linear-gradient(135deg,#05070d,#090d16_55%,#10070a)]" />

        <div className="atlas-shell relative py-12 sm:py-16">
          <p className="atlas-section-label">Trust before hype</p>

          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
            How the Atlas turns settings into useful evidence.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
            Handheld performance changes with updates, thermals, silicon,
            background tasks and the occasional Windows gremlin. Our job is not
            to pretend those variables vanished. It is to document the target,
            show the evidence and explain the compromise clearly enough that
            another player can reproduce it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/presets" className="atlas-button-primary">
              Browse documented presets
            </Link>
            <Link href="/benchmarks" className="atlas-button-secondary">
              Open benchmark wall
            </Link>
            <Link href="/settings-impact" className="atlas-button-secondary">
              Open Settings Guide
            </Link>
          </div>
        </div>
      </section>

      <div className="atlas-shell pt-6 sm:pt-8">
        <section className="grid gap-4 md:grid-cols-2">
          {principles.map((principle, index) => (
            <article key={principle.title} className="atlas-panel p-5 sm:p-6">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.16em] text-cyan-400">
                Principle {index + 1}
              </p>
              <h2 className="mt-3 text-2xl font-black">{principle.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {principle.text}
              </p>
            </article>
          ))}
        </section>

        <section className="atlas-panel mt-5 p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <div>
              <p className="atlas-section-label">Settings Impact Database</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">
                One canonical explanation, many in-game names
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">
                Graphics menus love renaming the same idea. The Settings Guide keeps one public page for each canonical setting and connects aliases such as “Shadows”, “Shadow Quality” and “Shadow Detail” behind the scenes. That prevents duplicate pages while still matching old and new presets automatically.
              </p>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-500">
                General FPS, visual and VRAM scores are HandheldAtlas editorial estimates. The vocabulary and technical descriptions are informed by official engine and GPU-vendor documentation, while a game-specific measured result takes priority whenever the game, handheld, TDP and resolution match.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-black text-slate-500">
                <a href="https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-reference-for-unreal-engine" target="_blank" rel="noreferrer noopener" className="transition hover:text-cyan-300">Unreal Engine scalability ↗</a>
                <a href="https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.5/manual/HDRP-Features.html" target="_blank" rel="noreferrer noopener" className="transition hover:text-cyan-300">Unity HDRP features ↗</a>
                <a href="https://developer.nvidia.com/rtx/dlss" target="_blank" rel="noreferrer noopener" className="transition hover:text-cyan-300">NVIDIA DLSS ↗</a>
                <a href="https://gpuopen.com/amd-fsr-sdk/" target="_blank" rel="noreferrer noopener" className="transition hover:text-cyan-300">AMD FSR SDK ↗</a>
              </div>
            </div>
            <Link href="/settings-impact" className="atlas-button-secondary text-center">
              Explore the Settings Guide →
            </Link>
          </div>
        </section>

        <section className="atlas-panel mt-5 overflow-hidden">
          <div className="border-b border-white/[0.07] p-5 sm:p-6">
            <p className="atlas-section-label">Signal map</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">
              Five labels that should never be confused
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              A popular preset can still be weakly documented. A verified preset
              can still perform differently after a game patch. The labels below
              answer different questions on purpose.
            </p>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {signals.map((signal) => (
              <article
                key={signal.name}
                className="grid gap-3 p-5 sm:grid-cols-[12rem_10rem_minmax(0,1fr)] sm:items-start sm:p-6"
              >
                <h3 className="text-lg font-black text-white">{signal.name}</h3>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-400">
                  {signal.owner}
                </p>
                <p className="text-sm leading-7 text-slate-400">
                  {signal.purpose}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="atlas-panel p-5 sm:p-6">
            <p className="atlas-section-label">Benchmark minimum</p>
            <h2 className="mt-2 text-2xl font-black">What a useful result needs</h2>
            <div className="mt-5 space-y-3">
              {[
                "Exact handheld and power target",
                "Resolution and upscaling method",
                "Average FPS and preferably 1% low",
                "Test scene or repeatable workload notes",
                "Relevant frame generation, VRR and cap details",
                "Battery estimate labelled as measured or estimated",
              ].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4 text-sm leading-6 text-slate-300"
                >
                  <span className="mt-1 text-cyan-400">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="atlas-panel p-5 sm:p-6">
            <p className="atlas-section-label">Limitations</p>
            <h2 className="mt-2 text-2xl font-black">What the numbers cannot promise</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              A preset is a documented starting point, not a blood oath from the
              silicon gods. Game updates, firmware, drivers, ambient temperature,
              background software and individual device variance can shift the
              result.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              When data is estimated, incomplete or based on a small sample, the
              interface should say so. Reports that conflict with the listed
              target can be moderated, and confidence can change as better data
              arrives.
            </p>
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4">
              <p className="text-sm font-black text-red-300">
                The honest answer is sometimes “we need more data.”
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                That answer is less sexy than fake precision, but considerably
                more useful.
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
