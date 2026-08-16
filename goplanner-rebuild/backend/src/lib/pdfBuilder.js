import PDFDocument from 'pdfkit';

/**
 * Streams a printable itinerary PDF directly to an Express response.
 * Returns the PDFDocument so the caller can pipe/end it.
 */
export function streamTripPDF(trip, res) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text(`Trip to ${trip.destination}`, { align: 'left' });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#555')
    .text(`${trip.days} day${trip.days === 1 ? '' : 's'}${trip.startDate ? ' · starting ' + new Date(trip.startDate).toDateString() : ''}`);
  if (trip.budget) {
    const status = trip.overBudget ? 'OVER BUDGET' : 'within budget';
    doc.text(`Budget: ${trip.budget} ${trip.currency} · Estimated total: ${trip.totalEstimatedCost} ${trip.currency} (${status})`);
  } else {
    doc.text(`Estimated total: ${trip.totalEstimatedCost} ${trip.currency}`);
  }
  doc.fillColor('#000');
  doc.moveDown();

  for (const day of trip.itinerary) {
    doc.fontSize(14).fillColor('#111').text(`Day ${day.day}${day.date ? ' — ' + new Date(day.date).toDateString() : ''}`);
    doc.moveDown(0.2);

    for (const act of day.activities) {
      if (act.status === 'cancelled') continue;
      doc.fontSize(11).fillColor('#000').text(`${act.start}–${act.end}  ${act.activity}`, { continued: false });
      if (act.location) doc.fontSize(9).fillColor('#555').text(`  ${act.location}`);
      if (act.estimatedCost) doc.fontSize(9).fillColor('#555').text(`  Est. cost: ${act.estimatedCost} ${trip.currency}`);
      if (act.reason) doc.fontSize(9).fillColor('#777').text(`  Why: ${act.reason}`, { italics: true });
      doc.moveDown(0.3);
      doc.fillColor('#000');
    }
    doc.moveDown(0.5);
  }

  doc.end();
  return doc;
}

export default { streamTripPDF };
