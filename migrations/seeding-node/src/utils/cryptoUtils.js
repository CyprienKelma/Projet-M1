import { v5 as uuidv5 } from "uuid";

// Define a unique namespace for your project's deterministic UUIDs.
// Generate this once (e.g., using `uuidgen` command or `uuid.v4()` online)
// and hardcode it here. Using a consistent namespace is crucial for v5.
// Example generated namespace:
const M1_SEEDING_NAMESPACE = "f47ac10b-58cc-4372-a567-0e02b2c3d479"; // REPLACE with your own generated UUID v4 if desired

/**
 * Generates a deterministic UUID (version 5) based on an input string and a namespace.
 * @param {string} input - The string to base the UUID on (e.g., 'user-123', 'group-45').
 * @returns {string} A UUID v5 string.
 */
export function generateUuid(input) {
  if (!input) {
    throw new Error("Input string cannot be empty for UUID generation.");
  }
  return uuidv5(input.toString(), M1_SEEDING_NAMESPACE);
}
