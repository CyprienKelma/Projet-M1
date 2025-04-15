-- migrate:up
CREATE TABLE groups_users_user (
    groups_id INTEGER NOT NULL,
    users_id INTEGER NOT NULL,
    PRIMARY KEY (groups_id, users_id),
    FOREIGN KEY (groups_id) REFERENCES groups (id),
    FOREIGN KEY (users_id) REFERENCES users (id)
);

-- migrate:down
DROP TABLE IF EXISTS groups_users_user;
