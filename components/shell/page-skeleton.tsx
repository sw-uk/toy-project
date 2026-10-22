import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** 데이터를 불러오는 동안 같은 카드 모양으로 자리를 잡아 둔다. */
export function PageSkeleton() {
  return (
    <main className="flex flex-col gap-4" aria-busy="true" data-testid="page-skeleton">
      <Skeleton className="h-4 w-64" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <Card key={n}>
            <CardHeader>
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-5 w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
