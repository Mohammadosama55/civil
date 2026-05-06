export interface ComplaintData {
  issueId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  upvotes: number;
  reporterName: string;
  createdAt: string;
  ward?: string;
}

function pdfEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function generateComplaintPDF(data: ComplaintData): Buffer {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const reportedOn = new Date(data.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const shortId = `#${data.issueId.slice(-8).toUpperCase()}`;
  const ward = data.ward ?? "—";
  const category = data.category.charAt(0).toUpperCase() + data.category.slice(1);

  const W = 595.28;
  const H = 841.89;

  const objects: string[] = [];
  let objNum = 0;

  function addObj(content: string): number {
    objNum++;
    objects.push(`${objNum} 0 obj\n${content}\nendobj`);
    return objNum;
  }

  const catalogN = addObj("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesN = 2; // reserved slot

  const stream = [
    // Dark navy header bar
    "0.059 0.094 0.122 rg",
    `0 ${H - 80} ${W} 80 re f`,

    // Header text — CIVIX (white)
    "1 1 1 rg",
    "BT /F1 22 Tf 40 " + (H - 52) + " Td (CIVIX) Tj ET",
    "BT /F2 9 Tf 40 " + (H - 66) + " Td (Civic Engagement Platform) Tj ET",

    // Header right — FORMAL COMPLAINT LETTER
    "BT /F1 11 Tf 310 " + (H - 48) + " Td (FORMAL COMPLAINT LETTER) Tj ET",

    // Reset to dark text
    "0.059 0.094 0.122 rg",

    // Date (right aligned approx)
    "0.392 0.455 0.518 rg",
    `BT /F2 9 Tf 370 ${H - 108} Td (Date: ${pdfEscape(today)}) Tj ET`,

    // TO block
    "0.059 0.094 0.122 rg",
    `BT /F1 11 Tf 40 ${H - 130} Td (TO:) Tj ET`,
    `BT /F2 10 Tf 40 ${H - 146} Td (Ward Officer${ward !== "—" ? " - " + pdfEscape(ward) : ""}) Tj ET`,
    `BT /F2 10 Tf 40 ${H - 162} Td (Municipal Corporation Office) Tj ET`,

    // SUBJECT
    `BT /F1 11 Tf 40 ${H - 188} Td (SUBJECT: ) Tj ET`,
    "0.067 0.725 0.506 rg",
    `BT /F1 11 Tf 130 ${H - 188} Td (Community Complaint: ${pdfEscape(data.title.slice(0, 55))}) Tj ET`,

    // Green rule
    "0.067 0.725 0.506 RG 1.5 w",
    `40 ${H - 198} m ${W - 40} ${H - 198} l S`,

    // Body paragraph
    "0.059 0.094 0.122 rg",
    `BT /F2 10 Tf 40 ${H - 224} Td (We, the undersigned residents, formally bring to your attention a civic issue) Tj ET`,
    `BT /F2 10 Tf 40 ${H - 238} Td (reported on the Civix platform with ${data.upvotes} community upvotes, indicating) Tj ET`,
    `BT /F2 10 Tf 40 ${H - 252} Td (significant public concern. We request immediate attention and resolution.) Tj ET`,

    // Info table background
    "0.973 0.976 0.980 rg",
    `40 ${H - 390} ${W - 80} 120 re f`,
    "0.886 0.910 0.937 RG 0.5 w",
    `40 ${H - 390} ${W - 80} 120 re S`,

    // Table rows
    "0.067 0.725 0.506 rg",
    `BT /F1 8 Tf 52 ${H - 282} Td (ISSUE ID) Tj ET`,
    "0.059 0.094 0.122 rg",
    `BT /F2 10 Tf 52 ${H - 295} Td (${pdfEscape(shortId)}) Tj ET`,

    "0.067 0.725 0.506 rg",
    `BT /F1 8 Tf 52 ${H - 312} Td (CATEGORY) Tj ET`,
    "0.059 0.094 0.122 rg",
    `BT /F2 10 Tf 52 ${H - 325} Td (${pdfEscape(category)}) Tj ET`,

    "0.067 0.725 0.506 rg",
    `BT /F1 8 Tf 280 ${H - 282} Td (LOCATION) Tj ET`,
    "0.059 0.094 0.122 rg",
    `BT /F2 10 Tf 280 ${H - 295} Td (${pdfEscape(data.location.slice(0, 38))}) Tj ET`,

    "0.067 0.725 0.506 rg",
    `BT /F1 8 Tf 280 ${H - 312} Td (REPORTED ON) Tj ET`,
    "0.059 0.094 0.122 rg",
    `BT /F2 10 Tf 280 ${H - 325} Td (${pdfEscape(reportedOn)}) Tj ET`,

    "0.067 0.725 0.506 rg",
    `BT /F1 8 Tf 52 ${H - 342} Td (COMMUNITY UPVOTES) Tj ET`,
    "0.059 0.094 0.122 rg",
    `BT /F2 10 Tf 52 ${H - 355} Td (${data.upvotes} residents have flagged this as urgent) Tj ET`,

    "0.067 0.725 0.506 rg",
    `BT /F1 8 Tf 280 ${H - 342} Td (WARD) Tj ET`,
    "0.059 0.094 0.122 rg",
    `BT /F2 10 Tf 280 ${H - 355} Td (${pdfEscape(ward)}) Tj ET`,

    // Description heading
    `BT /F1 10 Tf 40 ${H - 412} Td (Description of the Issue:) Tj ET`,

    // Description body (wrapped at ~95 chars)
    ...(data.description || "No description provided.").match(/.{1,90}(\s|$)/g)!.slice(0, 6).map((line, i) =>
      `BT /F2 10 Tf 40 ${H - 428 - i * 14} Td (${pdfEscape(line.trim())}) Tj ET`
    ),

    // Closing paragraph
    `BT /F2 10 Tf 40 ${H - 540} Td (We urge your office to acknowledge this complaint within 72 hours and) Tj ET`,
    `BT /F2 10 Tf 40 ${H - 554} Td (provide a resolution timeline. The community will track its progress on Civix.) Tj ET`,

    // Signature
    `BT /F2 10 Tf 40 ${H - 590} Td (Respectfully,) Tj ET`,
    "0.067 0.725 0.506 rg",
    `BT /F1 12 Tf 40 ${H - 608} Td (Civix Community Platform) Tj ET`,
    "0.392 0.455 0.518 rg",
    `BT /F2 8 Tf 40 ${H - 622} Td (Auto-generated when complaint crosses upvote threshold) Tj ET`,

    // Footer bar
    "0.059 0.094 0.122 rg",
    `0 0 ${W} 36 re f`,
    "0.580 0.635 0.694 rg",
    `BT /F2 8 Tf 130 16 Td (Generated by Civix - Empowering Citizens | civix.app) Tj ET`,
  ].join("\n");

  const streamBytes = Buffer.from(stream, "utf8");
  const contentStreamN = addObj(
    `<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`
  );

  const fontHelveticaN = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const fontHelveticaRegN = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");

  const pageN = addObj(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${contentStreamN} 0 R /Resources << /Font << /F1 ${fontHelveticaN} 0 R /F2 ${fontHelveticaRegN} 0 R >> >> >>`
  );

  // Now write the pages object as obj #2
  objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${pageN} 0 R] /Count 1 >>\nendobj`;

  // Build xref
  const header = "%PDF-1.4\n";
  const body = objects.join("\n") + "\n";
  const xrefOffset = header.length + body.length;

  const offsets: number[] = [];
  let pos = header.length;
  for (const obj of objects) {
    offsets.push(pos);
    pos += obj.length + 1;
  }

  const xref = [
    "xref",
    `0 ${objNum + 1}`,
    "0000000000 65535 f ",
    ...offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objNum + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");

  return Buffer.concat([Buffer.from(header), Buffer.from(body), Buffer.from(xref)]);
}
