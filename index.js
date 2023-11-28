require("dotenv").config();
const fetchAndStoreMovieDetails = require("./movieService");
const fetchAndStoreTVShowDetails = require("./tvshowService");

// 메인 로직을 여기서 구성합니다.
async function main() {
  for (let i = 0; i < 700000; i += 1000) {
    await fetchAndStoreTVShowDetails(i, i + 1000);
    await fetchAndStoreMovieDetails(i, i + 1000);
  }
}

main().catch(console.error);
