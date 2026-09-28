import { CURRENTLY } from "@/content/portfolio";

export function Currently() {
  return (
    <section className="section">
      <div className="wrap currently">
        <div>
          <p className="m" data-reveal>{CURRENTLY.label}</p>
          <h2 className="d mask" data-reveal style={{ ["--delay" as string]: "60ms" }}>
            <span>{CURRENTLY.school}</span>
          </h2>
          <div className="currently__rows" data-reveal style={{ ["--delay" as string]: "140ms" }}>
            <p className="m">{CURRENTLY.programme}</p>
            <p className="m">{CURRENTLY.years}</p>
            <p className="m">{CURRENTLY.place}</p>
          </div>
        </div>
        <ul className="currently__focus" data-reveal style={{ ["--delay" as string]: "200ms" }} aria-label="Current focus">
          {CURRENTLY.focus.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </div>
    </section>
  );
}
