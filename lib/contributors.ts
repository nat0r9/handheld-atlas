export type ContributorLevel =
  | "new_contributor"
  | "contributor"
  | "skilled_contributor"
  | "expert_contributor"
  | "master_contributor";

export interface PublicContributor {
  id: string;
  display_name: string | null;
  public_slug: string | null;
  avatar_url: string | null;
  contributor_level: ContributorLevel | null;
  public_profile: boolean | null;
}

export function contributorLevelLabel(level: ContributorLevel | null | undefined) {
  switch (level) {
    case "master_contributor": return "Master Contributor";
    case "expert_contributor": return "Expert Contributor";
    case "skilled_contributor": return "Skilled Contributor";
    case "contributor": return "Contributor";
    default: return "New Contributor";
  }
}

export function contributorLevelClass(level: ContributorLevel | null | undefined) {
  switch (level) {
    case "master_contributor": return "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300";
    case "expert_contributor": return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    case "skilled_contributor": return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
    case "contributor": return "border-green-500/30 bg-green-500/10 text-green-300";
    default: return "border-white/10 bg-white/[0.04] text-slate-300";
  }
}

export function contributorHref(profile: PublicContributor | null | undefined) {
  return profile?.public_profile && profile.public_slug ? `/contributors/${profile.public_slug}` : null;
}
