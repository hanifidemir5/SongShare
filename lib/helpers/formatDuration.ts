export function formatDuration(input: number | string): string {
    // If input is milliseconds (number)
    if (typeof input === "number") {
        const minutes = Math.floor(input / 60000);
        const seconds = ((input % 60000) / 1000).toFixed(0);
        return `${minutes}:${Number(seconds) < 10 ? "0" : ""}${seconds}`;
    }

    // If input is text, assumed to be ISO 8601 Duration (YouTube style: PT1H2M10S)
    if (typeof input === "string") {
        const match = input.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return "0:00";

        const hours = (parseInt(match[1]) || 0);
        const minutes = (parseInt(match[2]) || 0);
        const seconds = (parseInt(match[3]) || 0);

        let totalSeconds = hours * 3600 + minutes * 60 + seconds;

        if (totalSeconds === 0) return "0:00";

        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;

        // If hours exist, format might need to be different, but for songs mm:ss is usually fine
        // If > 60 mins, m will be > 60. E.g. 75:10.

        return `${m}:${s < 10 ? "0" : ""}${s}`;
    }

    return "0:00";
}
