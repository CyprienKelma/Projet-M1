-- migrate:up
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, -- creator/organizer of the activity
    activity_type VARCHAR NOT NULL, -- e.g., 'restaurant', 'museum', 'hiking'
    title VARCHAR NOT NULL,
    description TEXT,
    location VARCHAR NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL, -- when activity will happen
    status VARCHAR DEFAULT 'planned', -- planned, canceled, completed
    created_at TIMESTAMPTZ DEFAULT now (),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (group_id) REFERENCES groups (id)
);

-- migrate:down
DROP TABLE IF EXISTS activities;
