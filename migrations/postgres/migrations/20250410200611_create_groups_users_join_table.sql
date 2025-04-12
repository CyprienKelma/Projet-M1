-- migrate:up
CREATE TABLE groups_users_user (
    groups_id INTEGER NOT NULL,
    users_id INTEGER NOT NULL,
    PRIMARY KEY (groups_id, users_id),
    CONSTRAINT fk_group FOREIGN KEY (groups_id) REFERENCES groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (users_id) REFERENCES users (id) ON DELETE CASCADE
);

-- migrate:down
DROP TABLE IF EXISTS groups_users_user;
