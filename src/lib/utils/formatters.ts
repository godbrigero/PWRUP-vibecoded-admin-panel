export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getPercentageValue = (value: number): number => {
  return Math.min(Math.max(value, 0), 100);
};
