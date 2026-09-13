import { SoundToggle } from "@/components/chrome/SoundToggle";
import { LogoMark } from "@/components/primitives/LogoMark";
import { SITE } from "@/content/site";

export function Footer() {
  return (
    <footer data-tone="ink" style={{ background: "var(--color-ink)" }}>
      <div className="u-page jvr-footer">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <LogoMark size={20} gap={0.14} />
          <p className="u-micro">
            {SITE.domain} — {SITE.location}
          </p>
          <p className="u-micro">
            © {new Date().getFullYear()} {SITE.name}
          </p>
        </div>

        <div className="jvr-footer__links u-micro">
          <a href={`mailto:${SITE.email}`}>Email</a>
          <a
            href="https://github.com/jorisrijn-hash"
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub
          </a>
          <SoundToggle />
        </div>
      </div>
    </footer>
  );
}
