import { SoundToggle } from "@/components/chrome/SoundToggle";
import { LogoMark } from "@/components/primitives/LogoMark";
import { SITE } from "@/content/site";

export function Footer() {
  return (
    <footer data-tone="ink" className="scene">
      <div className="foot">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <LogoMark size={18} split={0} />
          <p className="u-micro">{SITE.domain} — {SITE.location}</p>
          <p className="u-micro">© {new Date().getFullYear()} {SITE.name}</p>
        </div>
        <div className="foot__links u-micro">
          <a href={`mailto:${SITE.email}`}>Email</a>
          <a href="https://github.com/jorisrijn-hash" target="_blank" rel="noreferrer noopener">GitHub</a>
          <SoundToggle />
        </div>
      </div>
    </footer>
  );
}
