export const exportToPDF = (content: string, fontSize: number = 12): void => {
  if (!content) return;
  
  // Remove all edit buttons and controls from content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // Remove all edit controls
  tempDiv.querySelectorAll('.ai-edit-trigger, .cell-actions, .row-delete-btn, .col-delete-btn, .col-resize-handle, .col-add-btn, .row-add-btn, .col-rewrite-btn, caption').forEach(el => {
    if (el.textContent?.trim() === '' || el.classList.contains('no-print')) {
      el.remove();
    }
  });
  
  const cleanContent = tempDiv.innerHTML;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Enable pop-ups.");
    return;
  }
  
  const printFontSize = fontSize < 10 ? 10 : fontSize;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Export Notes</title>
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Inter', sans-serif; font-size: ${printFontSize}pt; line-height: 1.5; color: #1e293b; background: white; margin: 0; padding: 20px; }
            h1 { font-family: 'Inter', sans-serif; font-size: 2.25em; font-weight: 800; color: #0f172a; border-bottom: 3px solid #0f172a; padding-bottom: 8px; margin-top: 0; margin-bottom: 16px; page-break-after: avoid; }
            h2 { font-family: 'Inter', sans-serif; font-size: 1.75em; font-weight: 700; color: #1e3a8a; margin-top: 24px; margin-bottom: 12px; page-break-after: avoid; border-bottom: 1px solid #e2e8f0; }
            h3 { font-family: 'Inter', sans-serif; font-size: 1.4em; font-weight: 600; color: #334155; margin-top: 18px; margin-bottom: 8px; page-break-after: avoid; }
            p { margin-bottom: 12px; text-align: justify; }
            ul, ol { margin-bottom: 12px; padding-left: 24px; }
            li { margin-bottom: 6px; }
            strong { color: #0f172a; font-weight: 700; }
            .key-point { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0; font-family: 'Inter', sans-serif; font-size: 0.95em; page-break-inside: avoid; }
            
            table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid #000 !important; page-break-inside: avoid; font-size: 0.9em; }
            th { background-color: #1e293b !important; color: white !important; padding: 8px; font-weight: 600; text-align: left; font-family: 'Inter', sans-serif; border: 1px solid #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            td { border: 1px solid #000 !important; padding: 8px; vertical-align: top; }
            tr:nth-child(even) { background-color: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            /* UPSC Answer Styles */
            .upsc-question-box { background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%) !important; border: 3px solid #1e3a8a; border-radius: 12px; padding: 20px 24px; margin: 0 0 32px 0; page-break-after: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .upsc-question { font-size: 1.3em; font-weight: 700; color: #ffffff !important; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .upsc-answer { padding: 24px; background: white; }
            .upsc-answer h3 { color: #1e40af; border-bottom: 2px solid #3b82f6; text-decoration: underline; }
            .upsc-answer h4 { color: #334155; padding-left: 12px; border-left: 3px solid #60a5fa; }
            .upsc-answer ul { list-style: none; }
            .upsc-answer ul li::before { content: '▸'; color: #3b82f6; font-weight: bold; margin-right: 8px; }
            .upsc-answer strong { background: linear-gradient(to bottom, transparent 70%, #fef08a 70%); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .upsc-answer .key-point { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important; border-left: 4px solid #2563eb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .upsc-diagram { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            
            .flowchart-container { display: flex; justify-content: center; margin: 24px 0; padding: 10px; border: 1px solid #e2e8f0; page-break-inside: avoid; }
            svg { max-width: 100%; height: auto; }

            figure { margin: 20px 0; text-align: center; page-break-inside: avoid; }
            img { max-width: 100%; height: auto; border: 1px solid #ccc; }
            figcaption { font-size: 0.9em; color: #666; font-style: italic; margin-top: 5px; }
            
            /* Hide all edit controls */
            .ai-edit-trigger, .cell-actions, .row-delete-btn, .col-delete-btn, .col-resize-handle, .col-add-btn, .row-add-btn, .col-rewrite-btn, .no-print { display: none !important; }

            @media print {
                body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print, .ai-edit-trigger, .cell-actions, .row-delete-btn, .col-delete-btn { display: none !important; }
                h1, h2, h3 { page-break-after: avoid; }
                table, .flowchart-container, .key-point, figure, img { page-break-inside: avoid; }
                p, li { orphans: 3; widows: 3; }
            }
            
            /* Control Buttons */
            .control-container { position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 12px; align-items: center; }
            .font-controls { display: flex; gap: 8px; background: white; border-radius: 8px; padding: 4px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
            .font-btn { background: #f1f5f9; color: #334155; border: none; padding: 8px 12px; border-radius: 6px; font-size: 18px; font-weight: 700; cursor: pointer; transition: all 0.2s; min-width: 40px; }
            .font-btn:hover { background: #e2e8f0; transform: scale(1.05); }
            .font-size-display { padding: 8px 12px; font-size: 14px; font-weight: 600; color: #475569; }
            .print-button { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.2s; }
            .print-button:hover { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); }
            @media print { .control-container { display: none !important; } }
        </style>
    </head>
    <body>
        <div class="control-container">
            <div class="font-controls">
                <button class="font-btn" onclick="decreaseFontSize()">A-</button>
                <span class="font-size-display" id="fontSizeDisplay">${printFontSize}pt</span>
                <button class="font-btn" onclick="increaseFontSize()">A+</button>
            </div>
            <button class="print-button" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>
        ${cleanContent}
        <script>
            let currentFontSize = ${printFontSize};
            
            function updateFontSize() {
                document.body.style.fontSize = currentFontSize + 'pt';
                document.getElementById('fontSizeDisplay').textContent = currentFontSize + 'pt';
            }
            
            function increaseFontSize() {
                if (currentFontSize < 24) {
                    currentFontSize += 1;
                    updateFontSize();
                }
            }
            
            function decreaseFontSize() {
                if (currentFontSize > 8) {
                    currentFontSize -= 1;
                    updateFontSize();
                }
            }
        </script>
    </body>
    </html>
  `;
  
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
