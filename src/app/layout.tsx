import "./globals.css";

export const metadata = {
  title: "Dev Project Dashboard",
  description: "Personal command center for active dev projects",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-neutral-100 min-h-screen">{children}</body>
    </html>
  );
}
