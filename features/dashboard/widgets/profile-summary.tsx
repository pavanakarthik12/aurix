"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usePersona, usePersonaStore } from "@/store/persona-store";
import { PersonaCard } from "@/features/onboarding/persona-card";
import { formatCurrency, initials } from "@/lib/format";

export function ProfileSummary() {
  const profile = usePersonaStore((s) => s.profile);
  const persona = usePersona();
  const name = profile.name || "Aurix User";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profile" description="Your details and financial persona." />

      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback>{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-lg font-semibold text-foreground">{name}</p>
              <p className="text-sm text-muted-foreground">
                {profile.occupation || "Occupation not set"}
                {profile.age ? ` · ${profile.age} years old` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{profile.preferredCurrency}</Badge>
              {profile.monthlyIncome && (
                <Badge variant="outline">{formatCurrency(profile.monthlyIncome)}/mo</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <PersonaCard persona={persona} />
      </div>
    </div>
  );
}
