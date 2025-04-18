export const DataVolume = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
};

// The interfaces become JSDoc types
/**
 * @typedef {Object} PgConfig
 * @property {string} host
 * @property {number} port
 * @property {string} user
 * @property {string} password
 * @property {string} database
 */

/**
 * @typedef {Object} CassandraConfig
 * @property {string[]} hosts
 * @property {number} port
 * @property {string} [username]
 * @property {string} [password]
 * @property {string} keyspace
 */

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 */

/**
 * @typedef {Object} Group
 * @property {number} id
 * @property {string} name
 * @property {string} description
 */

/**
 * @typedef {Object} Activity
 * @property {number} id
 * @property {number} group_id
 * @property {number} user_id
 * @property {string} title
 */

/**
 * @typedef {Object} SeedResults
 * @property {User[]} users
 * @property {Group[]} groups
 * @property {Activity[]} activities
 */
