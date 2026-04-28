import { InboxIcon } from "lucide-react";

export default function EmptyState({ message = "No data found" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <InboxIcon className="h-12 w-12 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
