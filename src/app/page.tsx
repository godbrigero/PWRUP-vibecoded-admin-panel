// src/app/page.tsx - Purpose: minimal, clear home with direct CTAs to dashboard
import Image from "next/image";
import Link from "next/link";
import { ConnectionBadge } from "@/components/ConnectionBadge";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Bar: brand + live status */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                className="h-8 w-auto dark:invert"
                src="/next.svg"
                alt="Blitz Renderer"
                width={120}
                height={24}
                priority
              />
              <span className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
                Blitz Renderer
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ConnectionBadge />
              <Link
                href="/settings"
                className="cursor-pointer text-sm text-gray-900 dark:text-white hover:underline"
                aria-label="Open Connection Settings"
              >
                ⚙️ Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main: concise hero + actions */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Control your Raspberry Pi fleet
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Open the dashboard.
          </p>
        </section>

        <section className="mt-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              aria-label="Open Dashboard"
              className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-white font-medium shadow-sm hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 dark:focus:ring-offset-gray-900 transition-colors"
            >
              Open Dashboard
            </Link>
            <Link
              href="/settings"
              aria-label="Open Connection Settings"
              className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-300 px-4 py-2 font-medium hover:bg-emerald-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 dark:focus:ring-offset-gray-900 transition-colors"
            >
              <span className="mr-2">⚙️</span>
              Connection Settings
            </Link>
            <Link
              href="/video"
              aria-label="Open Live Video"
              className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-blue-600 text-blue-700 dark:text-blue-300 px-4 py-2 font-medium hover:bg-blue-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 dark:focus:ring-offset-gray-900 transition-colors"
            >
              <span className="mr-2">🎥</span>
              Live Video
            </Link>
            <Link
              href="/system"
              aria-label="Open System Management"
              className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-gray-400 text-gray-800 dark:text-gray-200 px-4 py-2 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors"
            >
              <span className="mr-2">🛠️</span>
              System Management
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
