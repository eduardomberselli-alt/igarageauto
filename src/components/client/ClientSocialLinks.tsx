import { Instagram, Facebook, Youtube, Linkedin, Globe, Music2 } from "lucide-react";
import type { Profile } from "@/types";

type Props = {
  profile: Pick<
    Profile,
    | "instagramUrl"
    | "facebookUrl"
    | "tiktokUrl"
    | "youtubeUrl"
    | "linkedinUrl"
    | "websiteUrl"
  > | null | undefined;
  className?: string;
};

export function ClientSocialLinks({ profile, className }: Props) {
  if (!profile) return null;

  const links = [
    { url: profile.instagramUrl, label: "Instagram", Icon: Instagram },
    { url: profile.facebookUrl, label: "Facebook", Icon: Facebook },
    { url: profile.tiktokUrl, label: "TikTok", Icon: Music2 },
    { url: profile.youtubeUrl, label: "YouTube", Icon: Youtube },
    { url: profile.linkedinUrl, label: "LinkedIn", Icon: Linkedin },
    { url: profile.websiteUrl, label: "Site", Icon: Globe },
  ].filter((s) => s.url && s.url.trim());

  if (links.length === 0) return null;

  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      {links.map(({ url, label, Icon }) => (
        <a
          key={label}
          href={url as string}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="text-white/70 hover:text-[hsl(var(--primary))] transition-all duration-200 hover:scale-110"
        >
          <Icon className="h-[18px] w-[18px]" />
        </a>
      ))}
    </div>
  );
}
