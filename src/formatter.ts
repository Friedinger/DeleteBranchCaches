export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  const roundedBytes = Math.round(bytes * 100) / 100;
  const formattedBytes = roundedBytes
    .toFixed(2)
    .replaceAll(/\.0+$|(?<=\.\d*[1-9])0+$/g, "");
  return `${formattedBytes} ${units[i]}`;
}
