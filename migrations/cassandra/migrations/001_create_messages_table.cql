CREATE TABLE IF NOT EXISTS messages (
  conversation_id TEXT,
  message_id TEXT,
  sender_id INT,
  content TEXT,
  created_at TIMESTAMP,
  PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id ASC);
