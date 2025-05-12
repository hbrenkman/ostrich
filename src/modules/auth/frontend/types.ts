export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: () => boolean;
  isProjectManager: () => boolean;
}; 