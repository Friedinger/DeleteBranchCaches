export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString().replaceAll(",", "");
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
        .replace(/\.0+$|(?<=\.\d*[1-9])0+$/g, "");
    return `${formattedBytes} ${units[i]}`;
}
