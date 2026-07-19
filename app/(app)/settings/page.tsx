import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Manage your account, preferences, and security." />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Update your display preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="currency">Preferred currency</Label>
                <Input id="currency" defaultValue="INR (₹)" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="Asia/Kolkata (IST)" />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button size="sm">Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose what you want to hear about.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Notification preferences will be available soon.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage password and account access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input id="current-password" type="password" placeholder="••••••••" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" type="password" placeholder="••••••••" />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button size="sm">Update password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
