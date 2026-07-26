export const runtime = 'edge';

// src/app/projects/[slug]/page.tsx
export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Project: {params.slug}</h1>
      {/* TODO: notes, resources, links, activity */}
    </main>
  );
}
