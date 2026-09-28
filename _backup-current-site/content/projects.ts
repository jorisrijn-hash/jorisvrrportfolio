/**
 * PROJECTS — the one source for the Work index, the Featured Work spotlight
 * and the case studies.
 *
 * TWO RULES HOLD THIS FILE TOGETHER:
 *
 * 1. Everything beyond the identity of a project is OPTIONAL. A project that
 *    has no year, no stack, no architecture and no result simply has those
 *    fields absent, and every surface omits what is absent — it never
 *    substitutes a guess, a dash or a lorem line. Different projects can
 *    therefore have completely different case studies.
 *
 * 2. Nothing here may be invented. Titles, types and roles below were given
 *    by Joris; jorisvrr.com's stack and year are read off this repository.
 *    Everything still unknown (Goodreads' and BEBO's stack, dates, URLs,
 *    decisions, code, results) is simply missing, and stays missing until the
 *    real material exists. Placeholder MEDIA is allowed, but must be flagged
 *    `isPlaceholder`, which the interface labels as such.
 */

export type MediaKind = "image" | "video";

export type Media = {
  kind: MediaKind;
  /** the SOURCE path in media/work/; scripts/encode-media.py writes the
   *  WebP variants the site serves (content/work.ts maps source -> served) */
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** video only */
  poster?: string;
  /** generated stand-in, not the real project: the interface says so */
  isPlaceholder?: boolean;
};

/* ---- case-study sections. Every one optional; absent = the section is not
       rendered at all, for that project. ---------------------------------- */

export type ArchitectureNode = { id: string; label: string; kind?: "client" | "service" | "data" | "external"; note?: string };
export type ArchitectureEdge = { from: string; to: string; label?: string };
export type Architecture = { nodes: ArchitectureNode[]; edges: ArchitectureEdge[]; note?: string };

export type Entity = { name: string; fields?: string[]; note?: string };
export type Relation = { from: string; to: string; kind: "1-1" | "1-n" | "n-n"; note?: string };
export type DatabaseModel = { entities: Entity[]; relations?: Relation[]; note?: string };

/** The engineering thinking, not a list of technologies. */
export type Decision = {
  id: string;
  area: string;
  problem: string;
  decision: string;
  implementation?: string;
  result?: string;
};

export type CodeExample = {
  filename: string;
  language: string;
  code: string;
  /** 1-indexed lines to mark */
  highlight?: number[];
  note?: string;
};

export type Challenge = {
  title: string;
  problem: string;
  approach?: string;
  wrong?: string;
  solution?: string;
  learned?: string;
};

/** Measured, with where the number comes from. Never estimated. */
export type Metric = { label: string; value: string; source: string };

export type Project = {
  slug: string;
  /** "01" — the index number shown in the Work environment */
  number: string;
  title: string;
  subtitle?: string;
  /** "Full-stack application", "Client website" — what kind of thing it is */
  type: string;
  role?: string[];
  year?: string;
  technologies?: string[];
  /** a short system label for its state, when there is something true to say */
  status?: string;
  featured?: boolean;
  /** listed in the index, but opens nothing and claims nothing */
  comingSoon?: boolean;
  /**
   * The case study exists for development only: it exercises the section
   * components, and production behaves as though it were absent. Real
   * published case studies leave this off.
   */
  devOnly?: boolean;

  showcaseMedia?: Media;
  heroMedia?: Media;
  galleryMedia?: Media[];
  /**
   * A small stand-in kept with the project. The Work index is typographic —
   * a gallery of thumbnails would compete with the one surface the
   * environment exists to show — so nothing renders this today; it stays
   * because it is real media belonging to the project.
   */
  thumbMedia?: Media;

  liveUrl?: string;
  githubUrl?: string;

  context?: string[];
  problems?: { title: string; body: string; media?: Media }[];
  requirements?: { functional?: string[]; nonFunctional?: string[] };
  architecture?: Architecture;
  database?: DatabaseModel;
  engineeringDecisions?: Decision[];
  codeExamples?: CodeExample[];
  product?: { body?: string[]; media?: Media[] };
  challenges?: Challenge[];
  result?: { body?: string[]; metrics?: Metric[]; media?: Media[] };

  seo?: { title?: string; description?: string; keywords?: string[] };
  openGraph?: { title?: string; description?: string; image?: string };
};

/* ------------------------------------------------------------------ data */

/** The generated abstract stand-ins (scripts/gen-work-placeholders.py). */
const placeholder = (n: string): Media => ({
  kind: "image",
  src: `/work/placeholder-${n}.jpg`,
  alt: `Placeholder media for project ${n}`,
  width: 1680,
  height: 1074,
  isPlaceholder: true,
});
const placeholderThumb = (n: string): Media => ({
  kind: "image",
  src: `/work/placeholder-${n}-thumb.jpg`,
  alt: "",
  width: 320,
  height: 205,
  isPlaceholder: true,
});

/**
 * Development-only case-study material.
 *
 * `devOnly` already keeps it off every surface in production; this keeps it
 * out of the bundle as well. NODE_ENV is inlined at build time, so a
 * production build folds this to an empty object and the material below is
 * dead code the minifier removes.
 */
const devCase = <T extends Partial<Project>>(sections: T): Partial<Project> =>
  process.env.NODE_ENV !== "production" ? sections : {};

export const PROJECTS: Project[] = [
  {
    /*
     * GOODREADS — an independent redesign, and the first real case study.
     *
     * Everything below is read off the project itself: the repository at
     * github.com/jorisrijn-hash/goodreads (README, ARCHITECTURE.md, its nine
     * architecture decision records, the Flyway migrations and the Java and
     * TypeScript sources), the deployed application, and its live API. The
     * numbers are measurements that already existed in the project's own
     * documentation, or answers the running system gave on 2026-09-23.
     *
     * What is NOT here is as deliberate: no invented metric, no feature that
     * is only planned, no claim about use. Ratings, reviews, social features
     * and recommendations are named as out of scope because the project names
     * them as out of scope.
     */
    slug: "goodreads",
    number: "01",
    title: "Goodreads",
    subtitle: "An independent Goodreads redesign: the core reading system, built end to end.",
    type: "Full-stack application",
    role: ["Full-stack development", "Product design"],
    year: "2026",
    status: "Phase 1 — core reading system",
    featured: true,
    technologies: [
      "Java 25",
      "Spring Boot 4.1",
      "PostgreSQL 17",
      "Flyway",
      "TypeScript",
      "React 19",
      "Next.js 16",
      "Tailwind CSS 4",
      "Playwright",
      "Vercel",
      "Render",
      "Supabase",
    ],
    liveUrl: "https://goodreads-rose.vercel.app",
    githubUrl: "https://github.com/jorisrijn-hash/goodreads",

    showcaseMedia: {
      kind: "image",
      src: "/work/goodreads-discover.jpg",
      alt: "Discover: the catalogue as one surface, with a genre rail of real covers and a search field",
      width: 1680,
      height: 1074,
    },
    heroMedia: {
      kind: "image",
      src: "/work/goodreads-discover.jpg",
      alt: "Discover: the catalogue as one surface, with a genre rail of real covers and a search field",
      width: 1680,
      height: 1074,
    },
    thumbMedia: placeholderThumb("01"),

    context: [
      "A rebuild of Goodreads as a product, taken as far as a working system: a reader can search a real catalogue, open a book, save it, set where they are in it, and keep a private record of their reading.",
      "Everything a reader sees is served from this project's own PostgreSQL. The catalogue is built offline from Open Library (CC0) — 9,021 books, their authors, genres and covers — because an interface that waits on somebody else's API at request time is not a product, it is a proxy.",
      "Phase 1 is the core reading loop — Discover and search, Book Detail, saving with a status, My Library, then reading progress and the journal. Ratings, reviews, social features, recommendations and the reading challenge are later milestones, and are deliberately not stubbed out.",
    ],

    problems: [
      {
        title: "Search that punishes the reader for a typo",
        body: "Typo intolerance was the complaint the project set out to fix, and the data spike found the obvious data source has it too: of six common misspellings, four returned zero results from Open Library. A reader who mistypes a title gets an empty page and no way forward — so the catalogue had to recover the query itself, and say that it had.",
        media: {
          kind: "image",
          src: "/work/goodreads-search.jpg",
          alt: "The deployed search recovering a misspelling: showing results for a close match to \u201cthe grate gatsby\u201d",
          width: 1680,
          height: 1074,
        },
      },
      {
        title: "One book, returned ten times",
        body: "Book data is published per edition, not per work. Measured across the sample: a median of 13 editions per work, a mean of 111.7, and one work with 6,109. Search results built straight from that are ten rows of the same novel, and the reader has to choose between printings before they can choose a book.",
      },
      {
        title: "Metadata completeness is a property of curation, not of the provider",
        body: "Harvesting recent books produced a catalogue full of holes: for 2023–2026 only 12.8% had a cover, 37.9% a page count and 5.0% a usable description. The same pipeline over popularity-curated books returned 99.7%, 98.6% and 80.0%. What goes into the catalogue decides what the interface can show, so selection became an engineering problem rather than a content one.",
      },
      {
        title: "A shelf forgets what a reader did",
        body: "Modelling reading state as shelves means moving a book between them, and a move loses what was attached to the old shelf: when it was started, when it was finished, why it was saved. The reading life is a history, and a data model that cannot keep one cannot show one.",
      },
    ],

    requirements: {
      functional: [
        "Browse and search one catalogue from one surface, without an account.",
        "A book page that is the hub the reading loop returns to.",
        "Save a book with a reading state: want to read, currently reading, read, did not finish.",
        "A library filtered by that state, with counts.",
        "Record where the reader is in a book, and keep the history as a journal.",
        "Accounts with email and password, and a one-click demo reader for visitors.",
      ],
      nonFunctional: [
        "All business logic lives in Spring. Next.js renders, routes and composes — it never decides anything.",
        "No external API is called while serving a request; the catalogue is ingested offline.",
        "Search runs in PostgreSQL, and must recover typos the source data cannot.",
        "Sessions are server-side and opaque; no token in localStorage, CSRF on every mutating route including login.",
        "The schema moves forward only, through migrations that apply cleanly to an empty database.",
        "Covers are served by us, not hot-linked from the source.",
      ],
    },

    architecture: {
      nodes: [
        { id: "browser", label: "Browser", kind: "client", note: "session cookie, first-party" },
        { id: "next", label: "Next.js 16 (Vercel)", kind: "service", note: "rendering, routing, /api/v1 proxy" },
        { id: "spring", label: "Spring Boot 4.1 (Render)", kind: "service", note: "modular monolith — all domain rules" },
        { id: "pg", label: "PostgreSQL 17", kind: "data", note: "pg_trgm, unaccent, Flyway" },
        { id: "covers", label: "Object storage", kind: "data", note: "cover derivatives, served through our origin" },
        { id: "ingest", label: "Ingest job", kind: "external", note: "offline task, never in a request path" },
        { id: "ol", label: "Open Library", kind: "external", note: "CC0 catalogue source" },
      ],
      edges: [
        { from: "browser", to: "next", label: "same-origin" },
        { from: "next", to: "spring", label: "rewrite /api/v1" },
        { from: "spring", to: "pg", label: "JDBC" },
        { from: "next", to: "covers", label: "rewrite /covers" },
        { from: "ol", to: "ingest", label: "harvest" },
        { from: "ingest", to: "pg", label: "upsert" },
        { from: "ingest", to: "covers", label: "derivatives" },
      ],
      note: "The rule that holds it together: Spring owns every domain decision — search ranking, valid status transitions, progress, authorisation. If a loop over domain objects appears in TypeScript, it belongs in Java.",
    },

    database: {
      note: "The centre is library_item: exactly one row per reader and book, enforced by UNIQUE (user_id, book_id). Status is a state on that row, never a shelf — which is what lets notes, dates and history survive a change of status. progress_update is append-only and is the substrate for the journal; reading_event records the transitions, so the journal can say 'started reading' without inferring it from mutable columns. Dates are set when they first become true and are never cleared.",
      entities: [
        { name: "app_user", fields: ["id", "email UNIQUE", "username", "password_hash", "is_demo"], note: "one demo identity, enforced by a partial unique index" },
        { name: "book", fields: ["id", "source_key UNIQUE", "slug UNIQUE", "title", "isbn13", "page_count", "cover_key", "search_vector", "search_text"], note: "one Open Library work is one book — no edition table" },
        { name: "author", fields: ["id", "source_key UNIQUE", "slug UNIQUE", "name"] },
        { name: "genre", fields: ["id", "slug UNIQUE", "name"], note: "a controlled taxonomy; a book carries at most three" },
        { name: "library_item", fields: ["id", "user_id", "book_id", "status", "save_reason", "save_note", "current_page", "progress_percent", "started_at", "finished_at"], note: "UNIQUE (user_id, book_id)" },
        { name: "progress_update", fields: ["id", "library_item_id", "page", "percent", "note", "created_at"], note: "append-only history" },
        { name: "reading_event", fields: ["id", "library_item_id", "event_type", "from_status", "to_status", "created_at"], note: "SAVED, STARTED, FINISHED, ABANDONED, RESUMED, RESTARTED, STATUS_CHANGED" },
      ],
      relations: [
        { from: "app_user", to: "library_item", kind: "1-n", note: "cascades on delete" },
        { from: "book", to: "library_item", kind: "1-n" },
        { from: "book", to: "author", kind: "n-n", note: "book_author" },
        { from: "book", to: "genre", kind: "n-n", note: "book_genre, at most 3" },
        { from: "library_item", to: "progress_update", kind: "1-n" },
        { from: "library_item", to: "reading_event", kind: "1-n" },
      ],
    },

    engineeringDecisions: [
      {
        id: "postgres-search",
        area: "Search",
        problem: "The catalogue had to survive a typo. Of six common misspellings, four returned nothing at all from the source data — and adding a search cluster for 9,021 books would have been a second system to run, deploy and keep in sync.",
        decision: "Hybrid search inside PostgreSQL: full text first, trigram similarity as a fallback, and a prefix path for very short queries. No Elasticsearch.",
        implementation: "An ISBN is detected and looked up exactly, because full text can never match it. Otherwise a tsvector index answers exact, partial, author, punctuation and accent queries. When that returns nothing the query is retried: under about five characters against a prefix index, and otherwise against a pg_trgm similarity index at an explicit low threshold. Normalisation (lowercase, accents, typographic apostrophes) happens in generated columns, so the database owns it and the query cannot forget it.",
        result: "Verified against PostgreSQL 17.11: full text 0.083 ms, trigram 3.689 ms at 10,488 rows, and all four typos the source data missed return the right book first. A recovered query comes back with the text it corrected from, so the interface says 'showing results for a close match to…' instead of silently changing what was asked.",
      },
      {
        id: "offline-ingest",
        area: "External data",
        problem: "The catalogue comes from Open Library, and the obvious build calls it per request. The spike measured a 2.17 s median for a single cover fetch, and the API asks callers to identify themselves and stay under a rate limit — neither belongs in a page load.",
        decision: "Ingest the catalogue offline into our own PostgreSQL, and serve nothing from anyone else's API at request time.",
        implementation: "A resumable, idempotent pipeline: harvest, filter, select, hydrate, normalise, map genres, fetch covers, validate, upsert. Every raw response is written to disk before anything touches it, so a re-run replays instead of re-fetching. API calls are serialised through one lock at one request per 350 ms with the contact address in the User-Agent; cover downloads take a separate path, eight threads with a 40 ms floor, because they are latency-bound rather than rate-bound. Quality gates are absolute — a title, an author, English, a real cover that downloads, 40–2000 pages, a mapped genre — and every rejection is counted by reason.",
        result: "9,021 books with their authors, genres and three cover derivatives each, held entirely by us. Serving a reader never leaves our own infrastructure, and a book with no cover is rejected rather than shown with a hole in it.",
      },
      {
        id: "no-edition",
        area: "Data model",
        problem: "Book data is published per edition. Grouping them under a canonical work was the plan — an edition picker under each book — and the fallback for missing page counts was to recover them from an edition that had one.",
        decision: "One Open Library work is one book row, with the primary edition's fields denormalised onto it. No edition table, no picker.",
        implementation: "The measurement killed the fallback before it was built: page-count recovery from editions was 0 of 35, because the work-level figure is derived from editions in the first place — when it is absent, no edition has one. Edition-level completeness is worse than work level, and physical_format is free text with 29 distinct values across 835 records.",
        result: "The duplicate-results problem disappears rather than being solved: the source returns works, so nothing ever fans out. book.source_key remains the join point if editions are ever worth adding — and the catalogue's own numbers say what would have to change first.",
      },
      {
        id: "sessions-csrf",
        area: "Authentication",
        problem: "A reader's library is private, the deployment target scales to zero, and a self-contained token cannot be revoked before it expires.",
        decision: "Server-side sessions in PostgreSQL behind an opaque HttpOnly cookie. No JWT, nothing in localStorage, and CSRF protection on everything — including login.",
        implementation: "Spring Session JDBC keeps sessions in the database that is already running, so a cold start does not sign every reader out and no Redis joins the stack. Passwords are hashed with Argon2id under a length-only policy. The session id and the CSRF token are both rotated on login, against fixation. CSRF is cookie-to-header: a cross-origin attacker can cause the cookie to be sent but cannot read it, so cannot produce the header. Exempting login is common and wrong — login-CSRF signs a victim into the attacker's account — so nothing is exempt. A wrong password and an unknown account return byte-identical responses.",
        result: "The whole authentication loop is covered end to end on desktop and mobile viewports, including hostile returnTo targets and keyboard-only completion. The demo reader signs in with no password at all: the server authenticates a known identity whose stored hash no submitted password can produce, so a shared credential never exists to leak.",
      },
      {
        id: "same-origin-proxy",
        area: "API design",
        problem: "The frontend is on Vercel and the API is on another host. Left alone that makes every authenticated request cross-site — and a SameSite=Lax cookie is simply not sent on a cross-site XHR. Reaching for SameSite=None turns the session into a third-party cookie, which browsers increasingly refuse outright.",
        decision: "The browser never addresses the API host. It calls /api/v1/… and /covers/… on the frontend's own origin, and Next.js rewrites those to the API.",
        implementation: "Two rewrite rules and one server-only environment variable. Nothing about the API is NEXT_PUBLIC_, deliberately: a NEXT_PUBLIC_ value is compiled into the browser bundle, and exposing the API host there is exactly what makes the cookie third-party. Server Components bypass the proxy and call the API origin directly, because a server calling its own public URL would loop back through the edge for nothing.",
        result: "The session cookie is first-party, the CSRF cookie is readable by our own JavaScript because it is our own origin, and there is no CORS preflight on credentialed requests at all. Local development uses the same path, so what is tested is what ships. It is routing, not a second backend: the rewrite forwards bytes and has no request handler behind it.",
      },
    ],

    codeExamples: [
      {
        filename: "backend/…/catalog/CatalogueRepository.java",
        language: "java",
        note: "The search cascade. Each fallback is only reached because the one before it returned nothing, and the recovered query is handed back so the interface can say what it corrected.",
        highlight: [7, 15, 22, 26],
        code: `public SearchResult search(BookSearchQuery query) {
    if (!query.hasQuery()) {
        return browse(query);
    }
    // An ISBN is an identifier, not text: look it up exactly. Full text would never
    // match it, and the trigram fallback would return near-miss digit strings.
    Optional<String> isbn = Isbn.toIsbn13(query.q());
    if (isbn.isPresent()) {
        SearchResult exact = runSearch(query, Mode.ISBN, isbn.get());
        if (exact.total() > 0) {
            return exact;
        }
    }
    // Full text first: exact, partial, author and punctuation/accent queries all
    // resolve here, and it is an order of magnitude faster than the fallback.
    SearchResult fullText = runSearch(query, Mode.FULL_TEXT, query.q());
    if (fullText.total() > 0) {
        return fullText;
    }
    // Nothing matched, so the reader either mistyped or typed something too short
    // for full text to stem. Short queries try a prefix match first -- "Dune" should
    // find Dune, not a fuzzy neighbour -- and only then fall back to fuzzy matching.
    for (Mode fallback : query.isShortQuery()
            ? List.of(Mode.PREFIX, Mode.FUZZY_SHORT)
            : List.of(Mode.TRIGRAM)) {
        SearchResult recovered = runSearch(query, fallback, query.q());
        if (recovered.total() > 0) {
            return new SearchResult(recovered.books(), recovered.total(), query.q());
        }
    }
    return new SearchResult(List.of(), 0, null);
}`,
      },
      {
        filename: "frontend/next.config.ts",
        language: "ts",
        note: "The whole same-origin proxy. Two rules, and a variable that is deliberately not NEXT_PUBLIC_ — that single detail is what keeps the session cookie first-party.",
        highlight: [1, 6, 7],
        code: `const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8080";
const COVERS_BASE_URL = process.env.COVERS_BASE_URL ?? \`\${API_ORIGIN}/covers\`;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: \`\${API_ORIGIN}/api/v1/:path*\` },
      { source: "/covers/:path*", destination: \`\${COVERS_BASE_URL}/:path*\` },
    ];
  },
};`,
      },
      {
        filename: "backend/…/library/LibraryService.java",
        language: "java",
        note: "Saving a book is idempotent: PUT twice and the second call updates rather than failing. Two concurrent saves of the same book are decided by the unique constraint, and the loser re-reads the winner instead of handing the reader an error.",
        highlight: [6, 13, 14, 16],
        code: `public Entry save(long userId, String bookSlug, ReadingStatus status,
                  SaveReason reason, String note) {
    BookRow book = catalogue.findBySlug(bookSlug)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "No such book"));

    Optional<LibraryItem> existing = items.findByUserIdAndBookId(userId, book.id());
    LibraryItem item = existing.orElseGet(() -> LibraryItem.save(userId, book.id(), reason, note));
    ReadingStatus before = existing.map(LibraryItem::getStatus).orElse(null);
    ReadingEventType event = item.applyStatus(status, book.pageCount());

    try {
        items.save(item);
    } catch (DataIntegrityViolationException e) {
        // Two concurrent saves of the same book: the constraint held, so re-read the
        // winner rather than failing the reader's request.
        return new Entry(items.findByUserIdAndBookId(userId, book.id()).orElseThrow(), book);
    }
    record(item, event, before, status);
    return new Entry(item, book);
}`,
      },
    ],

    product: {
      body: [
        "Discovery and search are one surface. A reader arriving with nothing in mind browses a genre rail built from real covers; a reader who knows what they want types it into the same page. There is no separate search results page to be thrown into and no mode to switch between — the same view answers both, which is why the API has one endpoint that browses without a query and searches with one.",
        "Book Detail is the hub the loop returns to: what the book is, and the one action that matters. Saving it is a single press, and the reason and the note can be added afterwards or never — nothing stands between a reader and saving a book.",
        "The library is filtered by reading state rather than by shelf, which is the interface consequence of the data model: the reader sees want to read, currently reading, read and did not finish, and moving between them keeps the dates and the notes that were already there.",
        "Unfinished destinations are not shown as dead links. The journal exists in the schema and in the API before it exists in the navigation, so the interface never offers a door that opens onto nothing.",
      ],
      media: [
        { kind: "image", src: "/work/goodreads-book.jpg", alt: "Book detail: the cover, one primary action, and the work's other books", width: 1680, height: 1074 },
        { kind: "image", src: "/work/goodreads-home.jpg", alt: "The reader's hub, with the library summary by reading state", width: 1680, height: 1074 },
      ],
    },

    challenges: [
      {
        title: "The session cookie that looked configured and was not",
        problem: "Sessions worked, so the cookie was assumed to be right: HttpOnly, SameSite, the lot, set through the ordinary Spring Boot properties.",
        approach: "Configure server.servlet.session.cookie.* and move on.",
        wrong: "Spring Session takes cookie handling over from the servlet container and ignores those properties entirely. What was actually being sent was a cookie named SESSION with no HttpOnly flag and no SameSite attribute — found by reading the real Set-Cookie header rather than the configuration that was supposed to produce it.",
        solution: "A CookieSerializer bean that declares the name and the attributes explicitly, and a test that asserts them on the response so a silent downgrade cannot happen again.",
        learned: "Configuration is a claim about behaviour. The only evidence is the behaviour — here, one header.",
      },
      {
        title: "Making short queries work without ruining long ones",
        problem: "Trigram similarity rescues typos, but it is weak exactly where readers are casual: a four-character query like a shortened title scored 0.250, below the 0.3 threshold, so it returned nothing.",
        approach: "Lower the similarity threshold globally so short queries clear the bar.",
        wrong: "Measured, that inflated long-query matches from 2 to 10 — five times the noise on precisely the queries that had been working. One knob, tuned for the worst case, degraded the common one.",
        solution: "Route by query length instead of lowering the bar: under about five characters the query goes to a prefix index first, and only then to a fuzzy pass with an explicit low threshold. Along the way, unaccent turned out to be STABLE rather than IMMUTABLE — passing the dictionary explicitly makes it deterministic, which is what allows the normalisation to live in a generated column and be indexed.",
        learned: "A global threshold is rarely the right answer to a problem that only exists in part of the range.",
      },
      {
        title: "A deployment that reported success and served nothing",
        problem: "The first production deployment built successfully, reported READY, and returned 404 on every path including the home page.",
        approach: "Read the build logs for a failure. There was none — the build genuinely succeeded.",
        wrong: "The repository has the frontend in a subdirectory, and the platform's Root Directory setting lives in the dashboard, not in the repository. Left at the repository root it finds no framework, builds nothing, and deploys that nothing perfectly.",
        solution: "Set the root directory to the frontend, and write the signature down in the deployment documentation: a READY deployment 404ing on / is a wrong root, not a broken app.",
        learned: "A green deployment is not evidence that anything was deployed. The first request is.",
      },
    ],

    result: {
      body: [
        "Search the catalogue, open a book, save it with a reading state and see it in the library: that runs end to end on the deployed system, and a visitor can enter it as a demo reader in one press, with no account and no password.",
      "Reading progress and the journal exist in the schema and in the API. The journal is deliberately absent from the navigation until its interface is built — an unfinished destination is not shown as a dead link.",
        "It is honest about what it is not. Ratings, reviews, social features, recommendations and the reading challenge are later milestones and are not stubbed out — nothing in the interface pretends they exist.",
        "It is also honest about where it runs: the API is on a free tier that sleeps after fifteen idle minutes. Rather than hide that, pages that need it say the demo server is waking, poll in the background, and fill in by themselves.",
      ],
      metrics: [
        { label: "Catalogue", value: "9,021 books", source: "live API /catalogue/stats, 2026-09-23 — with 7,984 authors and 25 genres" },
        { label: "Full-text search", value: "0.083 ms", source: "EXPLAIN ANALYZE, PostgreSQL 17.11, bitmap index scan" },
        { label: "Typo fallback", value: "3.689 ms", source: "pg_trgm GIN index chosen by the planner at 10,488 rows" },
        { label: "Covers served by us", value: "27,330 files", source: "three derivatives per book, about 709 MB in object storage" },
        { label: "Backend tests", value: "137", source: "JUnit, against a real local PostgreSQL" },
        { label: "End-to-end tests", value: "39", source: "Playwright, run on desktop and mobile viewports" },
        { label: "Cold start, free tier", value: "168–179 s", source: "measured in production; cached pages render in 0.6–2 s meanwhile" },
      ],
      media: [
        { kind: "image", src: "/work/goodreads-library.jpg", alt: "My Library, filtered by reading state", width: 1680, height: 1074 },
      ],
    },

    seo: {
      title: "Goodreads, rebuilt — Java, Spring Boot and PostgreSQL case study",
      description:
        "An independent Goodreads redesign built as a working product: a 9,021-book catalogue ingested from Open Library, hybrid search in PostgreSQL that recovers typos, server-side sessions with CSRF, and a Spring Boot API behind a same-origin Next.js frontend.",
      keywords: ["software engineering case study", "Spring Boot", "PostgreSQL full-text search", "pg_trgm", "Next.js", "Java 25"],
    },
    openGraph: {
      title: "Goodreads, rebuilt — a full-stack case study",
      description:
        "A 9,021-book catalogue, hybrid PostgreSQL search that survives a typo, and a Spring Boot API that owns every domain decision.",
      // a JPEG for the platforms that still refuse WebP previews
      image: "/work/goodreads-og.jpg",
    },
  },
  {
    slug: "bebo",
    number: "02",
    title: "BEBO",
    type: "Client website",
    role: ["Web development", "Production"],
    showcaseMedia: placeholder("02"),
    thumbMedia: placeholderThumb("02"),
  },
  {
    slug: "jorisvrr",
    number: "03",
    title: "jorisvrr.com",
    type: "Portfolio",
    role: ["Frontend", "Interaction engineering"],
    year: "2026",
    // Read off this repository: package.json, and what the code actually uses.
    technologies: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Motion", "d3-geo", "Web Audio API", "Vercel"],
    liveUrl: "https://jorisvrr.com",
    showcaseMedia: placeholder("03"),
    thumbMedia: placeholderThumb("03"),

    /*
     * DEVELOPMENT CASE STUDY.
     *
     * `devOnly` keeps every word of this out of production: it exists to
     * exercise the case-study sections against real material rather than
     * lorem, and every line below is read off this repository — the files
     * named exist, the code is quoted verbatim, and each number carries the
     * script that measured it. Nothing here is marketing copy, and the real
     * case studies (Goodreads, BEBO) will replace it with their own.
     */
    ...devCase({
  devOnly: true,
      context: [
        "This site. A portfolio built as one continuous environment rather than a set of pages: a projected 3D sculpture, a media surface assembled from its cubes, and transitions that carry state between them.",
        "Built under three self-imposed constraints, which is what makes it an engineering project rather than a layout: no WebGL, no canvas, no 3D library. Everything on screen is HTML, CSS and one SVG.",
      ],
      problems: [
        {
          title: "A 3D scene without a 3D renderer",
          body: "The sculpture is a real perspective projection — camera, depth sort, back-face culling — but it has to reach the screen as SVG paths and CSS transforms. Every frame therefore costs DOM writes rather than GPU draw calls, and the naive version of that is unusable.",
        },
        {
          title: "The same environment on a phone",
          body: "The formation that builds the media surface animates hundreds of elements at once. At the desktop grid a mid-range phone dropped a fifth of the frames of that sequence, and the cause was not the sculpture.",
        },
      ],
      requirements: {
        functional: [
          "One environment: Home, Work and About are states of the same scene, not separate pages.",
          "Every transition is reversible, and navigation is refused while one is running.",
          "Case studies are data-driven: a project renders only the sections it actually has.",
          "Sound is opt-in behind a gate, and the interface works in full without it.",
        ],
        nonFunctional: [
          "No WebGL, no canvas, no three.js — SVG, CSS and HTML only.",
          "One requestAnimationFrame loop for the whole application.",
          "Zero React renders per animation frame.",
          "Respects prefers-reduced-motion by settling every state immediately.",
        ],
      },
      architecture: {
        nodes: [
          { id: "browser", label: "Browser", kind: "client" },
          { id: "next", label: "Next.js App Router", kind: "service", note: "static routes, one client experience" },
          { id: "machine", label: "Experience state machine", kind: "client", note: "lib/experience.tsx" },
          { id: "ticker", label: "Frame clock", kind: "client", note: "lib/ticker.ts — one rAF" },
          { id: "scene", label: "Sculpture projection", kind: "client", note: "camera, cull, depth sort — writes SVG paths" },
          { id: "stages", label: "Work / About stages", kind: "client", note: "lib/stages.ts — loaded on demand" },
          { id: "audio", label: "Web Audio engine", kind: "client", note: "opened after the consent gate" },
          { id: "media", label: "Encoded media", kind: "data", note: "public/work — WebP at 960 / 1680" },
          { id: "vercel", label: "Vercel", kind: "external" },
        ],
        edges: [
          { from: "vercel", to: "next", label: "serves" },
          { from: "browser", to: "next", label: "request" },
          { from: "next", to: "machine", label: "hydrate" },
          { from: "machine", to: "stages", label: "on demand" },
          { from: "machine", to: "ticker", label: "subscribe" },
          { from: "machine", to: "audio", label: "cue" },
          { from: "ticker", to: "scene", label: "per frame" },
          { from: "stages", to: "media", label: "fetch" },
        ],
        note: "No server of its own: the whole environment is client state over static routes.",
      },
      database: {
        note: "The site has no database. Its data model is the content layer — one typed source the Work index, the spotlight and the case studies all read.",
        entities: [
          { name: "Project", fields: ["slug", "number", "title", "type", "role[]", "year?", "technologies[]?"], note: "content/projects.ts — everything beyond identity optional" },
          { name: "Media", fields: ["kind", "src", "alt", "width?", "height?", "isPlaceholder?"] },
          { name: "Decision", fields: ["id", "area", "problem", "decision", "implementation?", "result?"] },
          { name: "CodeExample", fields: ["filename", "language", "code", "highlight[]?"] },
          { name: "Challenge", fields: ["title", "problem", "approach?", "wrong?", "solution?", "learned?"] },
          { name: "Metric", fields: ["label", "value", "source"], note: "a number may not exist without the script that measured it" },
        ],
        relations: [
          { from: "Project", to: "Media", kind: "1-n", note: "showcase, hero, thumb, gallery" },
          { from: "Project", to: "Decision", kind: "1-n" },
          { from: "Project", to: "CodeExample", kind: "1-n" },
          { from: "Project", to: "Challenge", kind: "1-n" },
          { from: "Project", to: "Metric", kind: "1-n", note: "through result" },
        ],
      },
      engineeringDecisions: [
        {
          id: "svg-over-webgl",
          area: "Rendering",
          problem: "A rotating sculpture with depth, occlusion and shading, without a 3D library, canvas or WebGL.",
          decision: "Project the geometry in JavaScript and write the result into one SVG element.",
          implementation: "A camera transform per vertex, convex back-face culling, a per-object depth sort, and a fixed pool of <path> slots reused every frame — so the DOM never grows or shrinks while the scene turns.",
          result: "The sculpture holds its frame budget at idle on a 1440 display (300 frames, 0 dropped, scripts/perf-suite.mjs).",
        },
        {
          id: "one-clock",
          area: "Frame budget",
          problem: "The cursor, the sculpture and every transition each wanted their own requestAnimationFrame loop, and they competed for the same vsync.",
          decision: "One frame clock for the whole application; everything that moves subscribes to it.",
          implementation: "lib/ticker.ts keeps a Set of callbacks, parks itself when the set empties, and clamps dt so a backgrounded tab cannot return with one enormous step.",
          result: "A frame is one callback pass, and an idle page costs nothing.",
        },
        {
          id: "attribute-writes",
          area: "Style cost",
          problem: "The sculpture writes thousands of SVG attributes per second, and in Chromium `d`, `fill` and `fill-opacity` are CSS properties — every write invalidates that element's style.",
          decision: "Never write an attribute that has not changed.",
          implementation: "Each path slot caches its last d, fill and opacities; the draw loop compares before writing, and shading is quantised so small numeric drift does not count as a change.",
          result: "Only genuinely changed faces cost style recalculation.",
        },
        {
          id: "no-react-per-frame",
          area: "State",
          problem: "Animating through React state would re-render a large tree sixty times a second.",
          decision: "React owns what exists; the frame clock owns what it looks like.",
          implementation: "Transitions raise data-attributes on a stage element at measured moments, and CSS keyed to those attributes runs the motion. Component state changes once per transition, not once per frame.",
          result: "Zero React renders per animation frame.",
        },
        {
          id: "phone-grid",
          area: "Mobile",
          problem: "Forming the media surface animates the whole grid at once. On a phone the desktop grid of 216 tiles dropped 21 frames of that sequence.",
          decision: "Form the surface from a coarser grid on small screens instead of animating fewer properties.",
          implementation: "lib/layout.ts carries the grid with the rest of the screen-dependent geometry (18x12, or 9x6 when compact); the sculpture's hand-over, the CSS grid and the background offsets all read it, so nothing can drift.",
          result: "The same sequence drops 3 frames, with style recalculation down from 630ms to 368ms (scripts/profile-work.mjs, 390px at 4x CPU throttle).",
        },
        {
          id: "audio-warm",
          area: "Audio",
          problem: "The first sound cue opened the AudioContext and imported the engine synchronously, freezing the first transition it landed in.",
          decision: "Open the audio device while nothing is moving — after the consent gate, never before it.",
          implementation: "The sound API exposes warm(); the experience calls it once the state machine reaches Home, so the device and the module are ready before any cue.",
          result: "A 232ms freeze on the first cue became none (Chrome long-task trace).",
        },
      ],
      codeExamples: [
        {
          filename: "lib/ticker.ts",
          language: "ts",
          note: "The whole frame clock. It parks itself when nothing is subscribed.",
          highlight: [8, 9, 13],
          code: `export type Tick = (now: number, dt: number) => void;

  const subs = new Set<Tick>();
  let raf = 0;
  let last = 0;

  function loop(now: number) {
    // Clamp dt so a backgrounded tab does not return with one enormous step.
    const dt = last ? Math.min(100, now - last) : 16.7;
    last = now;
    subs.forEach((fn) => fn(now, dt));
    if (subs.size) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
      last = 0;
    }
  }

  export function addTick(fn: Tick): () => void {
    subs.add(fn);
    if (!raf && typeof window !== "undefined") raf = requestAnimationFrame(loop);
    return () => removeTick(fn);
  }`,
        },
        {
          filename: "components/home/HomeStage.tsx",
          language: "tsx",
          note: "The inner loop of the sculpture: four comparisons stand between the projection and a style invalidation.",
          highlight: [1, 2, 4, 6],
          code: `if (d !== s.d) { s.d = d; s.el.setAttribute("d", d); }
  if (g !== s.g) { s.g = g; s.el.setAttribute("fill", GRAY[g]); }
  const fa = lite ? q20(face.fa) : q50(face.fa);
  if (fa !== s.fa) { s.fa = fa; s.el.setAttribute("fill-opacity", String(fa)); }
  const sa = lite ? q20(face.sa) : q50(face.sa);
  if (sa !== s.sa) { s.sa = sa; s.el.setAttribute("stroke-opacity", String(sa)); }`,
        },
      ],
      challenges: [
        {
          title: "The profiler was measuring the wrong thing",
          problem: "A tracer written to prove the sculpture's motion stayed continuous reported a regression of more than double after an optimisation that could not have caused one.",
          approach: "Trust the number, and start reverting.",
          wrong: "The tracer selected 176 path nodes when the core has 128, so it was following link geometry as well — and it measured distance per frame, which meant a dropped frame read as a jump.",
          solution: "Select exactly the core paths, and measure velocity per millisecond instead of per frame.",
          learned: "The regression was an artifact, and so was the improvement it had reported earlier. A measurement that cannot be wrong in both directions has not been checked.",
        },
        {
          title: "Optimising the wrong half of the screen",
          problem: "The Work formation dropped a fifth of its frames on a phone, and the sculpture handing its cubes to the surface was the obvious suspect.",
          approach: "Two rounds of work on the sculpture: quantised coordinates and shading, then fewer faces per cube and half the ring dissolved early.",
          wrong: "Together they cut path writes by 40% and moved style recalculation by nothing at all.",
          solution: "An isolation test — the same sequence with the sculpture removed, then with the surface's tiles removed — put 526ms of the 607ms on the tiles. The grid, not the geometry, was the cost.",
          learned: "Profile by removing things, not by guessing at them.",
        },
      ],
      result: {
        body: [
          "The environment runs as one scene: the sculpture, the media surface and the case studies share a camera, a frame clock and a state machine.",
          "It is still in development — these numbers are the current measurements, not a finished claim.",
        ],
        metrics: [
          { label: "Home, idle", value: "300 frames, 0 dropped", source: "scripts/perf-suite.mjs, 1440 at 2x" },
          { label: "Work formation, phone", value: "3 dropped frames (was 21)", source: "scripts/profile-work.mjs, 390px at 4x CPU throttle" },
          { label: "Style recalculation, phone", value: "368ms (was 630ms)", source: "scripts/profile-work.mjs, same run" },
          { label: "First sound cue", value: "no long task (was 232ms)", source: "Chrome long-task trace" },
          { label: "rAF loops", value: "1", source: "lib/ticker.ts" },
        ],
      },
    }),
  },
  {
    slug: "java-backend",
    number: "04",
    title: "Java / Backend",
    type: "Coming soon",
    comingSoon: true,
    status: "Coming soon",
    thumbMedia: placeholderThumb("04"),
  },
];

export const PROJECT_BY_SLUG: Record<string, Project> = Object.fromEntries(PROJECTS.map((p) => [p.slug, p]));

/** The project the Featured Work spotlight presents (checkpoint 2). */
export const FEATURED = PROJECTS.find((p) => p.featured) ?? PROJECTS[0];

/**
 * A project opens a case study only once it has something real to show — and
 * a dev-only one shows nowhere but development.
 */
export const hasCaseStudy = (p: Project, allowDev = process.env.NODE_ENV !== "production") =>
  !p.comingSoon &&
  (!p.devOnly || allowDev) &&
  Boolean(
    p.context?.length ||
      p.problems?.length ||
      p.requirements ||
      p.architecture ||
      p.database ||
      p.engineeringDecisions?.length ||
      p.codeExamples?.length ||
      p.product ||
      p.challenges?.length ||
      p.result,
  );
