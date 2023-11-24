require("dotenv").config();
const fetchAndStoreMovieDetails = require("./movieService");
const fetchAndStoreTVShowDetails = require("./tvshowService");

// 메인 로직을 여기서 구성합니다.
async function main() {
  await fetchAndStoreMovieDetails(1, 200000);
  await fetchAndStoreTVShowDetails(1, 200000);
  // 여기에 다른 배치 작업을 추가할 수 있습니다.
}

main().catch(console.error);
