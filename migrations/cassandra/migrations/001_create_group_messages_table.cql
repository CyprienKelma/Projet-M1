CREATE TABLE group_messages (
  group_id UUID,
  created_at TIMESTAMP,
  message_id UUID,
  user_id UUID,
  content TEXT,
  PRIMARY KEY (group_id, created_at)
) WITH CLUSTERING ORDER BY (created_at DESC);
