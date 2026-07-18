// src/components/document/document-card.tsx
import Link from "next/link";
import { FileText } from "lucide-react";

interface Props {
  id: string;
  title: string|null;
  updatedAt: Date;
}

export default function DocumentCard({
  id,
  title,
  updatedAt,
}: Props) {
  return (
    <Link href={`/documents/${id}`}>
        <div className="flex items-center justify-between rounded-xl border p-5 transition hover:bg-muted">
            <div className="flex items-center gap-4">
            <FileText className="h-6 w-6 text-blue-500" />

            <div>
                <h2 className="font-semibold truncate">
                {title || "Untitled Document"}
                </h2>

                <p suppressHydrationWarning className="text-sm text-muted-foreground">
                {updatedAt.toLocaleString()}
                </p>
            </div>
            </div>
        </div>
    </Link>
  );
}