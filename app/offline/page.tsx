'use client';
import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md border-border shadow-md">
        <CardHeader className="text-center items-center pb-2">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <WifiOff className="size-7" />
          </div>
          <CardTitle className="text-xl font-bold">You are currently offline</CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
            Flowboard requires an active connection to sync project mutations with the server. Your cached workspace shell and local drafts remain safely stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-3">
          <Button
            type="button"
            className="w-full gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw data-icon="inline-start" /> Reconnect & reload
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full gap-2"
          >
            <Link href="/">
              <ArrowLeft data-icon="inline-start" /> Return to cached dashboard
            </Link>
          </Button>
        </CardContent>
        <CardFooter className="justify-center border-t border-border pt-4 text-xs text-muted-foreground">
          Flowboard Offline Cache Engine Active
        </CardFooter>
      </Card>
    </main>
  );
}
