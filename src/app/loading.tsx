import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent-2" />
    </div>
  );
}
