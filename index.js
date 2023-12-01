require("dotenv").config();
const { processMoviesByYearRange } = require("./movieService");
const { processTVShowsByYearRange } = require("./tvshowService");
const logger = require("./logger");

async function main() {
  const startYear = 2023; // 시작 연도 설정
  const endYear = 1970; // 종료 연도 설정

  try {
    const connection = await connectToDatabase();

    for (let year = startYear; year >= endYear; year--) {
      logger.info(`Processing movies for year ${year}`);
      await processMoviesByYear(year, connection);

      logger.info(`Processing TV shows for year ${year}`);
      await processTVShowsByYear(year, connection);
    }

    await connection.end();
  } catch (error) {
    logger.error(`Error in main function: ${error.message}`);
  }
}

main().catch((error) => {
  logger.error(`Fatal error in main function: ${error.message}`);
});

main().catch((error) => {
  logger.error(`Fatal error in main function: ${error.message}`);
});
