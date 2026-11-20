import Link from "next/link";
import { createClient } from "../lib/supabase/public";
import { assertRead } from "../lib/catalog/read";
import "./magazine.css";

export const revalidate = 600;
export const metadata = { title: "HandheldAtlas — Handheld Guides and News", description: "In-depth handheld gaming guides and the latest device news." };

export default async function HomePage() {
  const db = await createClient();
  const [guides, news] = await Promise.all([
    db.from("guides").select("title,slug,cover_image_url").eq("status","published").order("published_at",{ascending:false,nullsFirst:false}).limit(4),
    db.from("news").select("title,slug,cover_image_url").eq("status","published").order("published_at",{ascending:false,nullsFirst:false}).limit(2),
  ]);
  assertRead(guides.error,"guides");
  assertRead(news.error,"news");
  const [lead, ...stories] = guides.data ?? [];
  const images = ["display","cooling","control"];
  return <main className="atlas-mag">
    <section className="atlas-cover">
      <picture><source media="(max-width: 700px)" srcSet="/magazine/mobile.webp"/><img className="atlas-art" src="/magazine/desktop.webp" alt="" fetchPriority="high"/></picture>
      <img className="atlas-logo" src="/magazine/logo.webp" alt="HandheldAtlas"/>
      <nav aria-label="Magazine"><img src="/magazine/emblem.png" alt=""/>{[["Guides","/guides"],["News","/news"],["Devices","/handhelds"],["Search","/search"],["Account","/profile"]].map(([name,url])=><Link prefetch={false} key={url} href={url}>{name}</Link>)}</nav>
      <div className="atlas-lead"><h1>{lead?.title ?? "Explore handheld gaming"}</h1><Link prefetch={false} href={lead ? "/guides/"+lead.slug : "/guides"}>{lead ? "Explore the guide" : "Browse guides"} ↗</Link></div>
      <aside><h2>On the radar</h2>{news.data?.map((item,i)=><Link prefetch={false} key={item.slug} href={"/news/"+item.slug}><img alt="" src={item.cover_image_url || "/magazine/"+images[i]+".webp"}/>{item.title} ↗</Link>)}{!news.data?.length && <Link href="/news">Explore news ↗</Link>}</aside>
    </section>
    <section className="atlas-stories" aria-label="More to explore">{images.map((img,i)=>{
      const story=stories[i];
      return <Link prefetch={false} key={img} href={story ? "/guides/"+story.slug : ["/guides","/news","/handhelds"][i]}><img src={story?.cover_image_url || "/magazine/"+img+".webp"} alt=""/><span>{story?.title ?? ["All guides","Handheld news","Explore devices"][i]} ↗</span></Link>;
    })}</section>
  </main>;
}