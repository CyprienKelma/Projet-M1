-- migrate:up
CREATE TYPE notification_status AS ENUM ('UNSEEN', 'SEEN', 'CLICKED', 'DELETED');

CREATE TABLE notification_states (
    -- Removed: id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    notification_id INTEGER NOT NULL,
    status notification_status DEFAULT 'UNSEEN',
    updated_at TIMESTAMPTZ DEFAULT now (),
    FOREIGN KEY (user_id) REFERENCES users (id),
    -- Added composite primary key constraint
    PRIMARY KEY (user_id, notification_id)
);

-- migrate:down
DROP TABLE IF EXISTS notification_states;

DROP TYPE IF EXISTS notification_status;
