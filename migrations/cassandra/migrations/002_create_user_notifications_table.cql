CREATE TABLE user_notifications (
  user_id UUID,
  notification_time TIMESTAMP,
  notification_id UUID,
  content TEXT,
  state TEXT,
  modified_at TIMESTAMP,
  PRIMARY KEY (user_id, notification_time)
) WITH CLUSTERING ORDER BY (notification_time DESC);
