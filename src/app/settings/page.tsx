import { BookmarkletInstall } from "@/components/bookmarklet-install";

export default function SettingsPage() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-accent-cyan mb-1">Configuration</p>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/50 text-sm mt-1">Connect the dashboard to the places you work.</p>
      </div>
      <BookmarkletInstall />
    </main>
  );
}
