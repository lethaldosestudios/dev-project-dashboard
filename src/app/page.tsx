// src/app/page.tsx
// Home: "What needs my attention today?"
export default function HomePage() {
  return (
    <main className="p-8 space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <section>
        <h2 className="text-lg font-medium mb-2">Needs attention</h2>
        {/* TODO: render stale projects + recent activity */}
      </section>
      <section>
        <h2 className="text-lg font-medium mb-2">Active projects</h2>
        {/* TODO: render project cards */}
      </section>
      <section>
        <h2 className="text-lg font-medium mb-2">Quick capture</h2>
        {/* TODO: quick-add resource form */}
      </section>
    </main>
  );
}
