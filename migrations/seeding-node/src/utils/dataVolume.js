/**
 * Determines the number of records to generate based on the volume setting.
 * @param {string} volume - The data volume ('small', 'medium', 'large', 'prod').
 * @returns {object} An object containing counts for different data types.
 */
export function getDataCounts(volume) {
  // Define base counts for different entities
  const counts = {
    // PostgreSQL Counts
    users: 0,
    groups: 0,
    activitiesPerGroup: 0,
    pgNotificationsPerUser: 0, // Renamed to avoid clash
    // Cassandra Counts
    messagesPerGroup: 0,
    csNotificationsPerUser: 0, // Renamed to avoid clash
    purchasesPerUser: 0,
    sessionsPerUser: 0,
  };

  // Adjust counts based on volume
  switch (volume) {
    case "small":
      counts.users = 50;
      counts.groups = 10;
      counts.activitiesPerGroup = 5;
      counts.pgNotificationsPerUser = 3;
      counts.messagesPerGroup = 20;
      counts.csNotificationsPerUser = 5;
      counts.purchasesPerUser = 3;
      counts.sessionsPerUser = 5;
      break;
    case "medium":
      counts.users = 200;
      counts.groups = 30;
      counts.activitiesPerGroup = 10;
      counts.pgNotificationsPerUser = 10;
      counts.messagesPerGroup = 50;
      counts.csNotificationsPerUser = 20;
      counts.purchasesPerUser = 10;
      counts.sessionsPerUser = 15;
      break;
    case "large":
      counts.users = 1000;
      counts.groups = 100;
      counts.activitiesPerGroup = 20;
      counts.pgNotificationsPerUser = 30;
      counts.messagesPerGroup = 200;
      counts.csNotificationsPerUser = 50;
      counts.purchasesPerUser = 30;
      counts.sessionsPerUser = 50;
      break;
    case "prod": // Added based on cassandra.js logic
      counts.users = 5000; // Example value, adjust as needed
      counts.groups = 500; // Example value, adjust as needed
      counts.activitiesPerGroup = 30; // Example value, adjust as needed
      counts.pgNotificationsPerUser = 50; // Example value, adjust as needed
      counts.messagesPerGroup = 500;
      counts.csNotificationsPerUser = 100;
      counts.purchasesPerUser = 50;
      counts.sessionsPerUser = 100;
      break;
    default: // Default to medium if volume is unknown
      console.warn(`Unknown data volume "${volume}", defaulting to medium.`);
      counts.users = 200;
      counts.groups = 30;
      counts.activitiesPerGroup = 10;
      counts.pgNotificationsPerUser = 10;
      counts.messagesPerGroup = 50;
      counts.csNotificationsPerUser = 20;
      counts.purchasesPerUser = 10;
      counts.sessionsPerUser = 15;
      break;
  }
  return counts;
}
