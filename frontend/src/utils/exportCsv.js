export function downloadCsv(filename, headers, rows) {
  const escape = (v) => {
    const s = String(v ?? "");
    const mustQuote = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return mustQuote ? `"${escaped}"` : escaped;
  };

  const lines = [];
  if (headers?.length) lines.push(headers.map(escape).join(","));
  for (const r of rows) lines.push(r.map(escape).join(","));

  // BOM để Excel mở tiếng Việt OK
  const csv = "\ufeff" + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
