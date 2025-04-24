import { Users } from 'lucide-react';

export default function Clients() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6" />
        <h1 className="text-2xl font-semibold">Clients</h1>
      </div>
      <div className="grid gap-6">
        {/* Add clients content here */}
      </div>
    </div>
  );
}