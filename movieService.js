const axios = require("axios");
const connectToDatabase = require("./database");
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

async function fetchAndStoreMovieDetails(startId, endId) {
  const connection = await connectToDatabase();
  try {
    for (let movieId = startId; movieId <= endId; movieId++) {
      try {
        // 영화 상세 정보 및 배우 정보 요청
        const url = `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=videos,credits&api_key=${TMDB_API_KEY}&language=ko-KR`;
        const response = await axios.get(url);
        const movie = response.data;

        const backdropPath = movie.backdrop_path
          ? TMDB_IMAGE_BASE_URL + movie.backdrop_path
          : null;
        const posterPath = movie.poster_path
          ? TMDB_IMAGE_BASE_URL + movie.poster_path
          : null;

        const directorInfo = movie.credits.crew.find(
          (person) => person.job === "Director"
        );

        // 영화 정보를 'movies' 테이블에 삽입
        const insertMovieQuery = `
          INSERT INTO movies (id, adult, backdrop_path, imdb_id, original_language, original_title, overview, popularity, poster_path, release_date, revenue, runtime, title, video, vote_average, vote_count, director_name, director_profile_path) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await connection.execute(insertMovieQuery, [
          movie.id,
          movie.adult,
          backdropPath,
          movie.imdb_id,
          movie.original_language,
          movie.original_title,
          movie.overview,
          movie.popularity,
          posterPath,
          movie.release_date,
          movie.revenue,
          movie.runtime,
          movie.title,
          movie.video,
          movie.vote_average,
          movie.vote_count,
          directorInfo ? directorInfo.name : null,
          TMDB_IMAGE_BASE_URL + directorInfo.profile_path,
        ]);

        // 장르 정보 처리 및 삽입
        const genres = movie.genres;
        for (const genre of genres) {
          const insertGenreQuery = `
            INSERT INTO genres (id, name) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE name = name;`;
          await connection.execute(insertGenreQuery, [genre.id, genre.name]);

          // movie_genre 테이블에 관계 삽입
          const insertMovieGenreQuery = `
            INSERT INTO movie_genre (movie_id, genre_id) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE genre_id = genre_id;`;
          await connection.execute(insertMovieGenreQuery, [movie.id, genre.id]);
        }

        // 배우 정보 처리 및 삽입
        const cast = movie.credits.cast;
        for (const actor of cast) {
          const actorProfilePath = actor.profile_path
            ? TMDB_IMAGE_BASE_URL + actor.profile_path
            : null;
          const insertActorQuery = `
            INSERT INTO actors (id, name, profile_path) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE name = name, profile_path = profile_path;`;
          await connection.execute(insertActorQuery, [
            actor.id,
            actor.name,
            actorProfilePath,
          ]);

          // movie_actor 테이블에 관계 삽입
          const insertMovieActorQuery = `
           INSERT INTO movie_actor (movie_id, actor_id) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE actor_id = actor_id;`;
          await connection.execute(insertMovieActorQuery, [movie.id, actor.id]);
        }

        // 비디오 정보를 'videos' 테이블에 삽입
        const videos = movie.videos.results;
        for (const video of videos) {
          const insertVideoQuery = `
            INSERT INTO videos (movie_id, video_key, name, site, type) VALUES (?, ?, ?, ?, ?)`;
          await connection.execute(insertVideoQuery, [
            movie.id,
            video.key,
            video.name,
            video.site,
            video.type,
          ]);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // console.error(`Movie ID ${movieId} not found.`);
        } else {
          // console.error(`Error fetching movie ID ${movieId}:`, error.message);
        }
      }
    }
  } catch (dbError) {
    // console.error("Database operation failed:", dbError);
  } finally {
    await connection.end();
  }
}

module.exports = fetchAndStoreMovieDetails;
