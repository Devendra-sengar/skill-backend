const cron = require('node-cron');
const Competition = require('../models/Competition'); // adjust path if needed

// Run every 1 minute
cron.schedule('* * * * *', async () => {
  const now = new Date();

  try {
    // Fetch competitions that are NOT cancelled
    const competitions = await Competition.find({
      status: { $ne: 'cancelled' }
    });

    for (const comp of competitions) {
      let newStatus = comp.status;

      if (now < comp.startTime) newStatus = 'upcoming';
      else if (now >= comp.startTime && now <= comp.endTime) newStatus = 'active';
      else if (now > comp.endTime) newStatus = 'completed';

      // Only update if status needs to change
      if (newStatus !== comp.status) {
        comp.status = newStatus;
        await comp.save();
        console.log(`Updated competition ${comp.title} to ${newStatus}`);
      }
    }
  } catch (err) {
    console.error('Error updating competition status:', err);
  }
});
