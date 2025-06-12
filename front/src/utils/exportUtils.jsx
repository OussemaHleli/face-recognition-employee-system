import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data, fileName) => {
  try {
    // Formatage des données pour Excel
    const exportData = data.map(item => ({
      ID: item.id,
      Prénom: item.firstName,
      Nom: item.lastName,
      Département: item.department,
      Date: item.date,
      Entrée: item.entryTime,
      Sortie: item.exitTime,
      Statut: item.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Présences');
    
    // Personnalisation des largeurs de colonnes
    const wscols = [
      { wch: 5 },  // ID
      { wch: 15 }, // Prénom
      { wch: 15 }, // Nom
      { wch: 15 }, // Département
      { wch: 12 }, // Date
      { wch: 8 },  // Entrée
      { wch: 8 },  // Sortie
      { wch: 10 }  // Statut
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Erreur lors de l'export Excel:", error);
    throw error;
  }
};

export const exportToPDF = (data, fileName) => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // En-tête avec style moderne
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, doc.internal.pageSize.width, 25, 'F');
    
    // Titre
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HISTORIQUE DES PRÉSENCES', 105, 15, { align: 'center' });
    
    // Date d'export
    doc.setFontSize(10);
    doc.text(`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);
    
    // Préparation des données du tableau
    const tableData = data.map(item => [
      item.id,
      item.firstName,
      item.lastName,
      item.department,
      item.date,
      item.entryTime,
      item.exitTime,
      { content: item.status, styles: { fontStyle: 'bold' } }
    ]);

    // Création du tableau avec autoTable
    autoTable(doc, {
      head: [['ID', 'Prénom', 'Nom', 'Département', 'Date', 'Entrée', 'Sortie', 'Statut']],
      body: tableData,
      startY: 30,
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        halign: 'center',
        valign: 'middle',
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 10 }, // ID
        1: { cellWidth: 25 }, // Prénom
        2: { cellWidth: 25 }, // Nom
        3: { cellWidth: 25 }, // Département
        4: { cellWidth: 20 }, // Date
        5: { cellWidth: 15 }, // Entrée
        6: { cellWidth: 15 }, // Sortie
        7: { cellWidth: 20 }  // Statut
      },
      didParseCell: (data) => {
        // Colorisation des statuts
        if (data.column.index === 7 && data.cell.raw) {
          const status = data.cell.raw.content || data.cell.raw;
          if (status === 'Présent') data.cell.styles.textColor = [46, 125, 50];
          if (status === 'Absent') data.cell.styles.textColor = [198, 40, 40];
          if (status === 'Retard') data.cell.styles.textColor = [251, 140, 0];
        }
      }
    });

    // Pied de page avec statistiques
    const finalY = doc.lastAutoTable.finalY + 15;
    const stats = {
      total: data.length,
      present: data.filter(x => x.status === 'Présent').length,
      absent: data.filter(x => x.status === 'Absent').length,
      late: data.filter(x => x.status === 'Retard').length
    };

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('STATISTIQUES', 14, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`• Total employés: ${stats.total}`, 14, finalY + 7);
    doc.text(`• Présents: ${stats.present}`, 14, finalY + 14);
    doc.text(`• Absents: ${stats.absent}`, 14, finalY + 21);
    doc.text(`• Retards: ${stats.late}`, 14, finalY + 28);

    // Enregistrement du PDF
    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
    throw error;
  }
};