import { Users } from 'lucide-react';

export default function Clients() {
  return (
    <div className="container mx-auto py-6 pt-24 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-h2">Clients</h1>
        </div>
      </div>
      <div className="grid gap-6">
        {/* Add clients content here */}
      </div>
    </div>
  );
}