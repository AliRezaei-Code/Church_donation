import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Church Tithing",
  description: "Give securely to support the mission.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <div className="text-xl font-semibold">Church Tithing</div>
              <nav className="text-sm text-slate-600 space-x-4">
                <a href="/">Give</a>
                <a href="/thank-you">Thank you</a>
                <a href="/legal">Legal</a>
                <a href="/admin">Admin</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t bg-white">
            <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-slate-500">
              © {new Date().getFullYear()} Church Tithing. All rights reserved.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
