# Public content cache

Public read-only Supabase clients use the publishable key without cookies or persisted sessions. Only GET/HEAD reads of explicitly published games, handhelds, benchmarks, presets, news and guides, plus two public game-rating aggregate RPCs, opt into the Next.js Data Cache. Unknown resources, user credentials, cookies and unfiltered/draft reads are never cacheable. Writes through this client are rejected. Authenticated clients and access checks remain unchanged.

Public data revalidates after 600 seconds. Homepage, news list/details and handheld list also use ISR so cache hits avoid page rendering. News paths are generated on demand. Guides cache article text separately from live user/voting state. Games and benchmark URL filters remain dynamic over cached public inputs.

Authenticated Server Actions retain their existing success-only revalidatePath calls, now routed through lib/cache/revalidate.ts. Public route sections additionally expire matching data tags using updateTag, including joined dependencies. Admin/account paths do not flush public tags. Benchmark edits/deletes also invalidate the standalone detail URL. Direct SQL/content imports outside the app rely on the 600-second background revalidation fallback; this is not an immediate publication guarantee.

Header/footer, game cards, benchmark card links and pagination disable speculative Next.js prefetch. Navigation still works normally; first clicks may wait longer for uncached dynamic pages.

Verification: node --experimental-strip-types --test tests/*.test.mjs; npm run lint -- --quiet; npm run build. Test cache headers on repeated requests to /, /news, /handhelds and a /news/[slug] URL. Verify filtered games/benchmarks, guide voting state, and login remain per-user. Failed static page regeneration throws rather than replacing the last good page with empty content.

CPU savings must be measured in Vercel Usage over comparable traffic/time windows. Cache HITs demonstrate avoided rendering, not a measured percentage saving or a reset of the billing allowance. Proxy session handling still runs; authenticated routes and filtered catalog rendering still consume compute.
