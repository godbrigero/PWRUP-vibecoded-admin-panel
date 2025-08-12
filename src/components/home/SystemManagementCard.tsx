// src/components/home/SystemManagementCard.tsx - Purpose: placeholder management card
export function SystemManagementCard() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            System Management
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Add, remove, and configure Raspberry Pi systems. Manage connections
            and system settings.
          </p>
          <div className="flex items-center mt-4 text-gray-500 dark:text-gray-400">
            <span className="text-sm font-medium">Coming Soon</span>
          </div>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">⚙️</div>
      </div>
    </div>
  );
}
