// SQL partagé avec les tests PostgreSQL. Les valeurs sont toujours paramétrées.
export const videosQuery = `SELECT v.id, v.youtube_id AS "youtubeId", v.title, v.author, v.notes,
 v.featured, v.created_at AS "createdAt", v.updated_at AS "updatedAt",
 COALESCE(array_agg(vc.category_id) FILTER (WHERE vc.category_id IS NOT NULL), ARRAY[]::uuid[]) AS categories
 FROM videos v LEFT JOIN video_categories vc ON vc.video_id = v.id
 GROUP BY v.id ORDER BY v.created_at DESC`;
export const createVideoQuery = `WITH saved AS (
 INSERT INTO videos(youtube_id,title,author,notes,featured) VALUES($1,$2,$3,$4,$5) RETURNING id
), linked AS (
 INSERT INTO video_categories(video_id,category_id) SELECT saved.id, unnest($6::uuid[]) FROM saved
) SELECT id FROM saved`;
export const updateVideoQuery = `WITH saved AS (
 UPDATE videos SET youtube_id=$2,title=$3,author=$4,notes=$5,featured=$6,updated_at=now() WHERE id=$1 RETURNING id
), removed AS (
 DELETE FROM video_categories WHERE video_id=$1 AND category_id <> ALL($7::uuid[]) RETURNING video_id
), linked AS (
 INSERT INTO video_categories(video_id,category_id)
 SELECT saved.id, unnest($7::uuid[]) FROM saved ON CONFLICT DO NOTHING
) SELECT id FROM saved`;
export const loginAttemptQuery = `INSERT INTO login_attempts(key_hash) VALUES($1)
 ON CONFLICT(key_hash) DO UPDATE SET
 attempts = CASE WHEN login_attempts.window_start < now() - interval '15 minutes' THEN 1 ELSE login_attempts.attempts + 1 END,
 window_start = CASE WHEN login_attempts.window_start < now() - interval '15 minutes' THEN now() ELSE login_attempts.window_start END
 RETURNING attempts, GREATEST(1, EXTRACT(EPOCH FROM (window_start + interval '15 minutes' - now()))::integer) AS retry_after`;
