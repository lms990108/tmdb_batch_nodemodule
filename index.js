require("dotenv").config();
const fetchAndStoreMovieDetails = require("./movieService");
const fetchAndStoreTVShowDetails = require("./tvshowService");
const logger = require("./logger");

async function main() {
  for (let i = 0; i < 1000000; i += 1000) {
    try {
      logger.info(`Processing TV shows for range ${i} - ${i + 999}`);
      await fetchAndStoreTVShowDetails(i, i + 999);

      logger.info(`Processing movies for range ${i} - ${i + 999}`);
      await fetchAndStoreMovieDetails(i, i + 999);
    } catch (error) {
      logger.error(`Error in main loop: ${error.message}`);
    }
  }
}

main().catch((error) => {
  logger.error(`Fatal error in main function: ${error.message}`);
});
