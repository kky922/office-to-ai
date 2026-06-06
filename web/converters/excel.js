// Excel (.xlsx/.xlsm) converter using SheetJS (global XLSX).
// Yields blocks split by sheet and by row-window so large sheets chunk cleanly.

function escapePipe(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function rowsToMarkdownTable(header, rows) {
  if (!header || header.length === 0) return "";
  const head = "| " + header.map(escapePipe).join(" | ") + " |";
  const sep  = "|" + header.map(() => " --- ").join("|") + "|";
  const body = rows
    .map(r => "| " + header.map((_, i) => escapePipe(r[i])).join(" | ") + " |")
    .join("\n");
  return [head, sep, body].filter(Boolean).join("\n");
}

function sheetToBlocks(wb, sheetName, rowsPerSection) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  // header: true → rows come back as arrays; includes empty cells as ""
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", blankrows: false });
  if (aoa.length === 0) {
    return [{
      kind: "sheet-section",
      md: `## 시트: ${sheetName}\n\n_(빈 시트)_\n`,
      meta: { source: `시트: ${sheetName}` },
    }];
  }
  const header = aoa[0];
  const rest = aoa.slice(1);
  const blocks = [];
  // One intro block per sheet plus row-window blocks.
  blocks.push({
    kind: "heading",
    md: `## 시트: ${sheetName}`,
    meta: { source: `시트: ${sheetName}` },
  });
  if (rest.length === 0) {
    blocks.push({
      kind: "sheet-section",
      md: rowsToMarkdownTable(header, []) + "\n",
      meta: { source: `시트: ${sheetName} · 헤더만` },
    });
    return blocks;
  }
  const step = Math.max(20, rowsPerSection | 0 || 200);
  for (let i = 0; i < rest.length; i += step) {
    const slice = rest.slice(i, i + step);
    const from = i + 2;                // +1 for 1-based, +1 for header row
    const to = i + 1 + slice.length;
    const label = `시트: ${sheetName} · 행 ${from}-${to}`;
    const table = rowsToMarkdownTable(header, slice);
    blocks.push({
      kind: "sheet-section",
      md: `### ${label}\n\n${table}\n`,
      meta: { source: label },
    });
  }
  return blocks;
}

export async function convertExcel(file, opts) {
  const buf = await file.arrayBuffer();
  // cellFormula keeps formulas accessible if later needed; cellDates normalizes dates.
  const wb = XLSX.read(buf, { type: "array", cellDates: true, cellNF: false });
  const rowsPerSection = opts?.sheetRows || 200;
  const blocks = [];
  blocks.push({
    kind: "heading",
    md: `# ${file.name}\n\n> Excel 문서 · 시트 ${wb.SheetNames.length}개\n`,
    meta: { source: file.name },
  });
  for (const name of wb.SheetNames) {
    blocks.push(...sheetToBlocks(wb, name, rowsPerSection));
  }
  return { blocks, images: [] };
}

if (typeof window !== "undefined") {
  window.__converters = window.__converters || {};
  window.__converters.excel = convertExcel;
}
