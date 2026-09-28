"use client";

import { useEffect, useState } from "react";
import type { Architecture, DatabaseModel } from "@/content/projects";
import { COMPACT_QUERY } from "@/lib/layout";

/** One screen test, shared by both diagrams: wide enough to draw across. */
function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const q = window.matchMedia(COMPACT_QUERY);
    const read = () => setCompact(q.matches);
    read();
    q.addEventListener("change", read);
    return () => q.removeEventListener("change", read);
  }, []);
  return compact;
}

/* ---- architecture -------------------------------------------------------
   The diagram is drawn, not illustrated: node positions come from the graph
   itself. A node's column is how far it is from an entry point, so the flow
   reads left to right and the edges never need to be placed by hand. On a
   phone the same graph stacks into one column and the edges turn with it. */

const BOX = { w: 186, h: 62 };

/** How far each node is from an entry point, and the nodes at each distance. */
function depths(model: Architecture) {
  const { nodes, edges } = model;
  const depth = new Map(nodes.map((n) => [n.id, 0]));
  // relax: a node sits one step after everything that points at it
  for (let pass = 0; pass < nodes.length; pass++) {
    let moved = false;
    edges.forEach((e) => {
      const d = (depth.get(e.from) ?? 0) + 1;
      if (depth.has(e.to) && d > (depth.get(e.to) ?? 0)) { depth.set(e.to, d); moved = true; }
    });
    if (!moved) break;
  }
  const cols: string[][] = [];
  nodes.forEach((n) => {
    const d = depth.get(n.id) ?? 0;
    (cols[d] ??= []).push(n.id);
  });
  return { depth, columns: cols.filter(Boolean) };
}

function layout(model: Architecture) {
  const { columns: used } = depths(model);
  const stack = false;

  const place = new Map<string, { x: number; y: number }>();
  const rows = Math.max(...used.map((c) => c.length));
  const W = used.length * (BOX.w + 74) - 74 + 40;
  const H = Math.max(rows * (BOX.h + 40), 220) + 20;
  used.forEach((col, ci) => {
    col.forEach((id, ri) => {
      place.set(id, {
        x: 20 + BOX.w / 2 + ci * (BOX.w + 74),
        y: (H * (ri + 1)) / (col.length + 1),
      });
    });
  });
  return { place, W, H, stack };
}

export function ArchitectureDiagram({ model }: { model: Architecture }) {
  const compact = useCompact();
  if (compact) return <ArchitectureBands model={model} />;
  return <ArchitectureMap model={model} />;
}

/**
 * The same graph on a narrow screen.
 *
 * Drawn wires do not survive one column: a line from the first box to the
 * third passes straight through the second and says something the graph does
 * not. So the depth the layout already computed becomes bands instead —
 * everything the same distance from an entry point sits on one row, and what
 * crosses between two bands is named between them. Nothing is implied that
 * an edge does not actually say.
 */
function ArchitectureBands({ model }: { model: Architecture }) {
  const { depth, columns } = depths(model);
  const byId = new Map(model.nodes.map((n) => [n.id, n]));

  return (
    <figure className="dgm dgm--bands">
      {columns.map((band, i) => {
        const into = model.edges.filter((e) => (depth.get(e.to) ?? 0) === i);
        const labels = [...new Set(into.map((e) => e.label).filter(Boolean))] as string[];
        // an edge that skips a band is named in full, not drawn as a jump
        const skips = into.filter((e) => (depth.get(e.to) ?? 0) - (depth.get(e.from) ?? 0) > 1);
        return (
          <div key={i} className="dgm__band" style={{ ["--i" as string]: i }}>
            {i > 0 ? (
              <p className="dgm__flow" aria-hidden="true">
                <span className="dgm__arrow" />
                {labels.length ? <span>{labels.join(" · ")}</span> : null}
              </p>
            ) : null}
            <div className="dgm__row">
              {band.map((id) => {
                const n = byId.get(id);
                if (!n) return null;
                return (
                  <div key={id} className="dgm__node dgm__node--band" data-kind={n.kind ?? "client"}>
                    <span className="dgm__node-label">{n.label}</span>
                    {n.note ? <span className="dgm__node-note">{n.note}</span> : null}
                  </div>
                );
              })}
            </div>
            {skips.length ? (
              <ul className="dgm__skips">
                {skips.map((e, k) => (
                  <li key={k}>{`${byId.get(e.from)?.label ?? e.from} → ${byId.get(e.to)?.label ?? e.to}${e.label ? ` · ${e.label}` : ""}`}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
      {model.note ? <figcaption>{model.note}</figcaption> : null}
    </figure>
  );
}

function ArchitectureMap({ model }: { model: Architecture }) {
  const { place, W, H, stack } = layout(model);
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <figure className="dgm" style={{ ["--w" as string]: W, ["--h" as string]: H }}>
      <div className="dgm__frame" data-stack={stack || undefined} style={stack ? { height: H } : { aspectRatio: `${W} / ${H}` }}>
        <svg
          className="dgm__wires"
          viewBox={`0 0 ${W} ${H}`}
          /* stacked, the wires are vertical and the box is a fixed height:
             letting x stretch keeps them centred, and nothing round is drawn */
          preserveAspectRatio={stack ? "none" : "xMidYMid meet"}
          aria-hidden="true"
        >
          {model.edges.map((e, i) => {
            const a = place.get(e.from);
            const b = place.get(e.to);
            if (!a || !b) return null;
            const [x1, y1, x2, y2] = stack
              ? [a.x, a.y + BOX.h / 2, b.x, b.y - BOX.h / 2]
              : [a.x + BOX.w / 2, a.y, b.x - BOX.w / 2, b.y];
            const d = stack
              ? `M${x1} ${y1} C${x1} ${y1 + 22} ${x2} ${y2 - 22} ${x2} ${y2}`
              : `M${x1} ${y1} C${x1 + 38} ${y1} ${x2 - 38} ${y2} ${x2} ${y2}`;
            return (
              <g key={`${e.from}-${e.to}-${i}`} className="dgm__edge" style={{ ["--i" as string]: i }}>
                <path d={d} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                {stack ? null : <circle cx={x2} cy={y2} r="2.5" fill="currentColor" />}
              </g>
            );
          })}
        </svg>

        {model.edges.map((e, i) => {
          const a = place.get(e.from);
          const b = place.get(e.to);
          if (!a || !b || !e.label) return null;
          // in the gutter between the boxes, never on top of one
          const [lx, ly] = stack
            ? [(a.x + b.x) / 2, (a.y + BOX.h / 2 + (b.y - BOX.h / 2)) / 2]
            : [(a.x + BOX.w / 2 + (b.x - BOX.w / 2)) / 2, (a.y + b.y) / 2];
          return (
            <span
              key={`l-${e.from}-${e.to}-${i}`}
              className="dgm__label"
              style={stack ? { left: "50%", top: ly, ["--i" as string]: i } : { left: pct(lx, W), top: pct(ly, H), ["--i" as string]: i }}
            >
              {e.label}
            </span>
          );
        })}

        {model.nodes.map((n, i) => {
          const pos = place.get(n.id);
          if (!pos) return null;
          return (
            <div
              key={n.id}
              className="dgm__node"
              data-kind={n.kind ?? "client"}
              style={
                stack
                  ? { left: "50%", top: pos.y, width: `min(${BOX.w}px, 100% - 40px)`, ["--i" as string]: i }
                  : { left: pct(pos.x, W), top: pct(pos.y, H), width: pct(BOX.w, W), ["--i" as string]: i }
              }
            >
              <span className="dgm__node-label">{n.label}</span>
              {n.note ? <span className="dgm__node-note">{n.note}</span> : null}
            </div>
          );
        })}
      </div>
      {model.note ? <figcaption>{model.note}</figcaption> : null}
    </figure>
  );
}

/* ---- data model ---------------------------------------------------------
   Entities as they are declared, and the relations between them drawn as
   relations — not a table of foreign keys. */

const ARROW = { "1-1": "1 — 1", "1-n": "1 — n", "n-n": "n — n" } as const;

export function DataDiagram({ model }: { model: DatabaseModel }) {
  return (
    <figure className="dmodel">
      {model.note ? <p className="dmodel__note">{model.note}</p> : null}
      <ul className="dmodel__entities">
        {model.entities.map((e, i) => (
          <li key={e.name} className="dmodel__entity" style={{ ["--i" as string]: i }}>
            <p className="dmodel__name">{e.name}</p>
            {e.fields?.length ? (
              <ul className="dmodel__fields">
                {e.fields.map((f) => <li key={f}>{f}</li>)}
              </ul>
            ) : null}
            {e.note ? <p className="dmodel__entity-note">{e.note}</p> : null}
          </li>
        ))}
      </ul>
      {model.relations?.length ? (
        <ul className="dmodel__relations" aria-label="Relations">
          {model.relations.map((r, i) => (
            <li key={`${r.from}-${r.to}-${i}`} style={{ ["--i" as string]: i }}>
              <span className="dmodel__from">{r.from}</span>
              <span className="dmodel__link" aria-hidden="true">
                <i />
                <em>{ARROW[r.kind]}</em>
                <i />
              </span>
              <span className="dmodel__to">{r.to}</span>
              {r.note ? <span className="dmodel__rel-note">{r.note}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}
