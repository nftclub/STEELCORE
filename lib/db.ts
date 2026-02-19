import Dexie, { type Table } from 'dexie';

export interface Workout {
  id: string;       // UUID
  date: number;     // timestamp
  duration: number;
  intensity: number; // 1–10
  load: number;
}

export class SteelDB extends Dexie {
  workouts!: Table<Workout, string>;

  constructor() {
    super('steelDB');

    this.version(1).stores({
      workouts: 'id, date',
    });
  }
}

export const db = new SteelDB();