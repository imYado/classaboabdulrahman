// Subtitle files (.srt / .vtt from transcription sites) -> "[m:ss.s] text" lines the player reads.
// Anything without "-->" (plain text, or already "[m:ss] text") is kept as is.
const ts = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
function fromSubs(src) {
  if (!/-->/.test(src)) return src.trim();
  return src.replace(/\r/g, '').split(/\n\s*\n/).map(block => {
    const rows = block.split('\n'), i = rows.findIndex(r => r.includes('-->'));
    const m = i < 0 ? null : rows[i].match(/(?:(\d+):)?(\d+):(\d+)[.,](\d+)\s*-->/);
    if (!m) return '';
    const sec = (+m[1] || 0) * 3600 + +m[2] * 60 + +m[3] + +('0.' + m[4]);
    const text = rows.slice(i + 1).join(' ').replace(/<[^>]+>/g, '').trim();
    return text ? `[${ts(sec)}] ${text}` : '';
  }).filter(Boolean).join('\n');
}
