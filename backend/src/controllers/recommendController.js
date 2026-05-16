import { estimateTripDetails } from './tripController.js';

export const recommend = async (req, res) => {
  try {
    const { destination, description, startTime, durationHours } = req.body;
    if (!destination) return res.status(400).json({ success: false, message: 'destination is required' });

    const estimated = await estimateTripDetails(destination, description || '', { startTime, durationHours });

    // Format dateDisplay for the top-level date
    const formatToAMPM = (input) => {
      let d;
      if (!input) d = new Date();
      else {
        d = new Date(input);
        if (isNaN(d.getTime())) d = new Date(String(input).replace(/-/g, '/'));
      }
      if (isNaN(d.getTime())) return String(input || '');
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const mm = minutes < 10 ? '0' + minutes : minutes;
      return `${month}/${day}/${year} ${hours}:${mm} ${ampm}`;
    };

    const result = {
      success: true,
      data: {
        destination,
        description: description || '',
        date: estimated.date,
        dateDisplay: formatToAMPM(estimated.date),
        places: estimated.places,
        durationHours: estimated.durationHours,
        costEstimate: estimated.costEstimate,
        itinerary: estimated.itinerary
      }
    };

    return res.json(result);
  } catch (err) {
    console.error('Recommend error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
