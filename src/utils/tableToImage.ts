import html2canvas from 'html2canvas';

export const exportTableToPNG = async (tableElement: HTMLElement, filename: string = 'table') => {
  try {
    // Create a temporary container with white background
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.background = 'white';
    container.style.padding = '40px';
    container.style.width = 'max-content';
    container.style.minWidth = '800px';
    document.body.appendChild(container);

    // Clone the table
    const tableClone = tableElement.cloneNode(true) as HTMLElement;
    
    // Remove edit buttons and controls
    tableClone.querySelectorAll('.cell-actions, .row-delete-btn, .col-delete-btn, .ai-edit-trigger, caption, .col-resize-handle, .col-add-btn, .row-add-btn, .col-rewrite-btn').forEach(el => el.remove());
    
    // Force table styling for PNG export
    tableClone.style.fontSize = '14px';
    tableClone.style.fontFamily = 'Inter, sans-serif';
    tableClone.style.width = 'auto';
    tableClone.style.margin = '0';
    tableClone.style.borderCollapse = 'collapse';
    tableClone.style.border = '2px solid #000000';
    
    // Style all cells with borders
    const allCells = tableClone.querySelectorAll('th, td');
    allCells.forEach((cell: Element) => {
      const htmlCell = cell as HTMLElement;
      htmlCell.style.border = '1px solid #000000';
      htmlCell.style.padding = '12px 16px';
    });
    
    // Style header cells
    const headerCells = tableClone.querySelectorAll('th');
    headerCells.forEach((th: Element) => {
      const htmlTh = th as HTMLElement;
      htmlTh.style.backgroundColor = '#172554';
      htmlTh.style.color = '#ffffff';
      htmlTh.style.fontWeight = '600';
    });
    
    // Style body rows (alternate colors)
    const bodyRows = tableClone.querySelectorAll('tbody tr');
    bodyRows.forEach((row: Element, index: number) => {
      if (index % 2 === 1) {
        (row as HTMLElement).style.backgroundColor = '#f8fafc';
      }
    });
    
    container.appendChild(tableClone);

    // Generate canvas with proper dimensions
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
      width: container.scrollWidth,
      height: container.scrollHeight,
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');

  } catch (error) {
    console.error('Error exporting table to PNG:', error);
    throw error;
  }
};

export const exportAllTablesToPNG = async (editorElement: HTMLElement) => {
  const tables = editorElement.querySelectorAll('table');
  
  if (tables.length === 0) {
    alert('No tables found to export!');
    return;
  }

  for (let i = 0; i < tables.length; i++) {
    await exportTableToPNG(tables[i] as HTMLElement, `table-${i + 1}`);
    // Small delay between exports
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  alert(`Successfully exported ${tables.length} table(s) as PNG images!`);
};
