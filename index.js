require("dotenv").config();
const fetchAndStoreMovieDetails = require("./movieService");
const fetchAndStoreTVShowDetails = require("./tvshowService");

// 메인 로직을 여기서 구성합니다.
async function main() {
  for (let i = 0; i < 300000; i += 10000) {
    await fetchAndStoreTVShowDetails(1, i + 10000);
    await fetchAndStoreMovieDetails(i, i + 10000);
  }
}

main().catch(console.error);
