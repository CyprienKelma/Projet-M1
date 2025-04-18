export type DataVolume = "small" | "medium" | "large";

export interface PgConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface CassandraConfig {
  hosts: string[];
  port: number;
  username?: string;
  password?: string;
  keyspace: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Group {
  id: number;
  name: string;
  description: string;
}

export interface Activity {
  id: number;
  group_id: number;
  user_id: number;
  title: string;
}

export interface SeedResults {
  users: User[];
  groups: Group[];
  activities: Activity[];
}
