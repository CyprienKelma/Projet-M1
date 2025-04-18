CREATE TABLE user_session_events (
  user_id UUID,
  event_time TIMESTAMP,
  session_id UUID,
  event_type TEXT,  -- 'START' or 'END'
  PRIMARY KEY (user_id, event_time, session_id)
) WITH CLUSTERING ORDER BY (event_time DESC);
