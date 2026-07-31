export type AuthProvider = 'email' | 'google';

export interface User {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  /** RedSport points balance — earned at checkout (1 sol = 1 point) */
  points: number;
  createdAt: string;   // ISO date — "miembro desde"
}
