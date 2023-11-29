const axios = require("axios");
const logger = require("./logger");
const connectToDatabase = require("./database");
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

async function fetchAndStoreTVShowDetails(startId, endId) {
  const connection = await connectToDatabase();

  try {
    for (let tvShowId = startId; tvShowId <= endId; tvShowId++) {
      try {
        const detailsUrl = `https://api.themoviedb.org/3/tv/${tvShowId}?append_to_response=videos,credits&api_key=${TMDB_API_KEY}&language=ko-KR`;
        const detailsResponse = await axios.get(detailsUrl);
        const tvShow = detailsResponse.data;

        const director =
          tvShow.created_by && tvShow.created_by.length
            ? tvShow.created_by[0]
            : null;
        const directorName = director ? director.name : null;
        const directorProfilePath =
          director && director.profile_path
            ? TMDB_IMAGE_BASE_URL + director.profile_path
            : null;

        const firstAirDate = tvShow.first_air_date
          ? new Date(tvShow.first_air_date)
          : null;
        const lastAirDate = tvShow.last_air_date
          ? new Date(tvShow.last_air_date)
          : null;

        const insertTVShowQuery = `
          INSERT INTO tvshows (
            id, adult, backdrop_path, first_air_date, last_air_date, name,
            number_of_episodes, number_of_seasons, overview, popularity,
            poster_path, type, vote_average, vote_count, director_name, director_profile_path
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await connection.execute(insertTVShowQuery, [
          tvShow.id,
          tvShow.adult,
          tvShow.backdrop_path
            ? TMDB_IMAGE_BASE_URL + tvShow.backdrop_path
            : null,
          firstAirDate,
          lastAirDate,
          tvShow.name,
          tvShow.number_of_episodes,
          tvShow.number_of_seasons,
          tvShow.overview,
          tvShow.popularity,
          tvShow.poster_path ? TMDB_IMAGE_BASE_URL + tvShow.poster_path : null,
          tvShow.type,
          tvShow.vote_average,
          tvShow.vote_count,
          directorName,
          directorProfilePath,
        ]);

        const genres = tvShow.genres;
        for (const genre of genres) {
          // 장르 데이터가 genres 테이블에 존재하는지 확인하고, 없다면 삽입
          const insertGenreQuery = `
            INSERT INTO genres (id, name) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE name = name;`;
          await connection.execute(insertGenreQuery, [genre.id, genre.name]);

          // tvshow_genre 테이블에 관계 삽입
          const insertTVShowGenreQuery = `
            INSERT INTO tvshow_genre (tvshow_id, genre_id) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE genre_id = genre_id;`;
          await connection.execute(insertTVShowGenreQuery, [
            tvShow.id,
            genre.id,
          ]);
        }

        // 배우 정보 처리 및 삽입 로직
        const credits = tvShow.credits;
        const cast = credits.cast;
        for (const actor of cast) {
          // 'actors' 테이블에 배우 정보 삽입
          const insertActorQuery = `
            INSERT INTO actors (id, name, profile_path) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE name = name, profile_path = profile_path;`;
          await connection.execute(insertActorQuery, [
            actor.id,
            actor.name,
            actor.profile_path
              ? TMDB_IMAGE_BASE_URL + actor.profile_path
              : null,
          ]);

          // 'tvshow_actor' 테이블에 TV 쇼와 배우의 관계 삽입
          const insertTVShowActorQuery = `
            INSERT INTO tvshow_actor (tvshow_id, actor_id) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE actor_id = actor_id;`;
          await connection.execute(insertTVShowActorQuery, [
            tvShow.id,
            actor.id,
          ]);
        }

        // 비디오 정보를 'videos' 테이블에 삽입
        const videos = tvShow.videos.results;
        for (const video of videos) {
          const insertVideoQuery = `
            INSERT INTO videos (tvshow_id, video_key, name, site, type) VALUES (?, ?, ?, ?, ?)`;
          await connection.execute(insertVideoQuery, [
            tvShow.id,
            video.key,
            video.name,
            video.site,
            video.type,
          ]);
        }

        logger.info(`Successfully processed TV Show ID ${tvShowId}`);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          logger.error(`TV Show ID ${tvShowId} not found.`);
        } else {
          logger.error(`Error fetching TV Show ID ${tvShowId}:`, error.message);
        }
      }
    }
  } catch (dbError) {
    logger.error("Database operation failed:", dbError);
  } finally {
    await connection.end();
  }
}

module.exports = fetchAndStoreTVShowDetails;
