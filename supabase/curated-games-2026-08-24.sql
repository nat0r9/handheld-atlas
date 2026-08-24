-- Curated from the Steam Deck Top Played chart for 18–24 August 2026.
-- These records intentionally remain drafts until both Metacritic scores and
-- at least one published preset or benchmark have been verified.

insert into public.games (
  name, slug, genre, developer, publisher, release_date, release_year,
  platforms, steam_app_id, metacritic_critic_score, metacritic_url,
  notes, cover_image_url, cover_source_name, cover_source_url,
  status, created_by
)
select incoming.*, editor.id
from (
  values
    ('Palworld', 'palworld', 'Open-world survival crafting', 'Pocketpair', 'Pocketpair', date '2026-07-09', 2026, array['Windows']::text[], 1623730::bigint, null::smallint, 'https://www.metacritic.com/game/palworld/', 'An open-world survival crafting game built around exploring, building bases and collecting creatures called Pals. It supports solo play and multiplayer, with combat, automation and resource management sharing equal focus.', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1623730/library_600x900.jpg', 'Steam Store', 'https://store.steampowered.com/app/1623730/Palworld/', 'draft'::public.content_status),
    ('Red Dead Redemption 2', 'red-dead-redemption-2', 'Action adventure', 'Rockstar Games', 'Rockstar Games', date '2019-12-05', 2019, array['Windows']::text[], 1174180::bigint, 93::smallint, 'https://www.metacritic.com/game/red-dead-redemption-2/', 'A story-driven open-world action adventure set in the final years of the American frontier. Players follow outlaw Arthur Morgan through exploration, gunfights, hunting and the evolving relationships of the Van der Linde gang.', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900.jpg', 'Steam Store', 'https://store.steampowered.com/app/1174180/Red_Dead_Redemption_2/', 'draft'::public.content_status),
    ('Marvel''s Spider-Man Remastered', 'marvels-spider-man-remastered', 'Action adventure', 'Insomniac Games, Nixxes Software', 'PlayStation Publishing LLC', date '2022-08-12', 2022, array['Windows']::text[], 1817070::bigint, 87::smallint, 'https://www.metacritic.com/game/marvels-spider-man-remastered/', 'An open-world superhero action adventure following an experienced Peter Parker in New York City. Fast web traversal, acrobatic combat, stealth encounters and cinematic story missions form the core of the PC remaster.', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1817070/library_600x900.jpg', 'Steam Store', 'https://store.steampowered.com/app/1817070/Marvels_SpiderMan_Remastered/', 'draft'::public.content_status),
    ('No Man''s Sky', 'no-mans-sky', 'Action adventure', 'Hello Games', 'Hello Games', date '2016-08-12', 2016, array['Windows', 'macOS']::text[], 275850::bigint, 61::smallint, 'https://www.metacritic.com/game/no-mans-sky/', 'A science-fiction exploration and survival game set in a procedurally generated universe. Players travel between planets, gather resources, build bases, trade, fight and upgrade their ship and equipment alone or with others.', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/275850/library_600x900.jpg', 'Steam Store', 'https://store.steampowered.com/app/275850/No_Mans_Sky/', 'draft'::public.content_status),
    ('Hogwarts Legacy', 'hogwarts-legacy', 'Action RPG', 'Avalanche Software', 'Warner Bros. Games', date '2023-02-10', 2023, array['Windows']::text[], 990080::bigint, 83::smallint, 'https://www.metacritic.com/game/hogwarts-legacy/', 'An open-world action RPG set in the wizarding world of the 1800s. Players attend Hogwarts, learn spells, explore the castle and surrounding regions, solve puzzles and fight magical creatures and hostile wizards.', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/990080/library_600x900.jpg', 'Steam Store', 'https://store.steampowered.com/app/990080/Hogwarts_Legacy/', 'draft'::public.content_status),
    ('Resident Evil 4', 'resident-evil-4', 'Survival horror', 'CAPCOM Co., Ltd.', 'CAPCOM Co., Ltd.', date '2023-03-23', 2023, array['Windows']::text[], 2050650::bigint, 91::smallint, 'https://www.metacritic.com/game/resident-evil-4/', 'A modern reimagining of the survival-horror classic, following Leon S. Kennedy on a rescue mission in rural Europe. Over-the-shoulder combat, resource management, exploration and tense set pieces drive the campaign.', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2050650/library_600x900.jpg', 'Steam Store', 'https://store.steampowered.com/app/2050650/Resident_Evil_4/', 'draft'::public.content_status),
    ('Monster Hunter: World', 'monster-hunter-world', 'Action RPG', 'CAPCOM Co., Ltd.', 'CAPCOM Co., Ltd.', date '2018-08-08', 2018, array['Windows']::text[], 582010::bigint, 88::smallint, 'https://www.metacritic.com/game/monster-hunter-world/', 'A cooperative action RPG focused on tracking and hunting large monsters across connected ecosystems. Every hunt feeds a progression loop of crafting stronger weapons and armour for increasingly demanding encounters.', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/582010/library_600x900.jpg', 'Steam Store', 'https://store.steampowered.com/app/582010/Monster_Hunter_World/', 'draft'::public.content_status),
    ('Ghost of Tsushima DIRECTOR''S CUT', 'ghost-of-tsushima-directors-cut', 'Action adventure', 'Sucker Punch Productions, Nixxes Software', 'PlayStation Publishing LLC', date '2024-05-16', 2024, array['Windows']::text[], 2215430::bigint, 86::smallint, 'https://www.metacritic.com/game/ghost-of-tsushima-directors-cut/', 'An open-world action adventure set during the Mongol invasion of Tsushima. Jin Sakai combines precise sword combat, archery and stealth while travelling across the island and choosing how far to depart from samurai tradition.', 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2215430/library_600x900.jpg', 'Steam Store', 'https://store.steampowered.com/app/2215430/Ghost_of_Tsushima_DIRECTORS_CUT/', 'draft'::public.content_status)
) as incoming(
  name, slug, genre, developer, publisher, release_date, release_year,
  platforms, steam_app_id, metacritic_critic_score, metacritic_url,
  notes, cover_image_url, cover_source_name, cover_source_url, status
)
cross join lateral (
  select id from public.profiles where role = 'admin' order by created_at limit 1
) editor
where not exists (
  select 1 from public.games existing
  where existing.slug = incoming.slug
     or existing.steam_app_id = incoming.steam_app_id
);
