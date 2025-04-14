CREATE TABLE IF NOT EXISTS notifications (
  user_id INT,
  notification_id TEXT,
  type TEXT,
  message TEXT,
  read BOOLEAN,
  created_at TIMESTAMP,
  PRIMARY KEY (user_id, notification_id)
) WITH CLUSTERING ORDER BY (notification_id DESC);
