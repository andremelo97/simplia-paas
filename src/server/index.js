require('dotenv').config();
const app = require('./app');
const { initAudioCleanupJob } = require('./jobs/cleanupOldAudioFiles');
const { initTranscriptionCostUpdateJob } = require('./jobs/updateTranscriptionCosts');
const { initExpirePublicQuotesJob } = require('./jobs/expirePublicQuotes');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize cron jobs
  initAudioCleanupJob();  // Hourly: Clean audio files >24h old
  initTranscriptionCostUpdateJob();  // Daily 3 AM: Update transcription costs
  initExpirePublicQuotesJob();  // Hourly: Expire public quote links
});
 
