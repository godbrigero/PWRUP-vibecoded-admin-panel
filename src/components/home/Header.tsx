// src/components/home/Header.tsx - Purpose: site header with branding and status
import Image from "next/image";

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image
                className="h-8 w-auto dark:invert"
                src="/next.svg"
                alt="Blitz Renderer"
                width={120}
                height={24}
                priority
              />
            </div>
            <h1 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
              Blitz Renderer Admin
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              System Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
