CREATE TABLE user_purchases (
  user_id UUID,
  purchase_time TIMESTAMP,
  purchase_id UUID,
  product_type TEXT,
  amount DECIMAL,
  currency TEXT,
  PRIMARY KEY (user_id, purchase_time)
) WITH CLUSTERING ORDER BY (purchase_time DESC);
