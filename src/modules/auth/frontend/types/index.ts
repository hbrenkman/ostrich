export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'project_management' | 'production';
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
}