import type { Metadata } from "next";
import { Plus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RecentTransactions } from "@/features/dashboard/widgets/recent-transactions";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Expenses" };

export default function ExpensesPage() {
  const hasTransactions = MOCK_TRANSACTIONS.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Expenses"
        description="Every transaction, extracted and categorized automatically."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        }
      />

      {hasTransactions ? (
        <div className="space-y-6">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="screenshots">From screenshots</TabsTrigger>
              <TabsTrigger value="manual">Manual entry</TabsTrigger>
              <TabsTrigger value="splitwise">Splitwise</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <RecentTransactions />
            </TabsContent>
            <TabsContent value="screenshots">
              <Card className="p-10 text-center text-sm text-muted-foreground">
                Upload a payment screenshot to see extracted expenses here.
              </Card>
            </TabsContent>
            <TabsContent value="manual">
              <Card className="p-10 text-center text-sm text-muted-foreground">
                Manually added expenses will appear here.
              </Card>
            </TabsContent>
            <TabsContent value="splitwise">
              <Card className="p-10 text-center text-sm text-muted-foreground">
                Connect Splitwise to sync shared expenses.
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Upload a payment screenshot or add an expense manually to get started."
          action={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          }
        />
      )}
    </div>
  );
}
