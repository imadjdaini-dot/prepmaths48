"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ForgotForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Démo : l'envoi d'email réel sera branché plus tard (SMTP / Resend).
    setSent(true);
    toast.success("Si ce compte existe, un email a été envoyé.");
  }

  if (sent) {
    return (
      <div className="rounded-md border border-line bg-surface-2 p-5 text-sm text-ink-2">
        Vérifie ta boîte mail. Le lien de réinitialisation expire dans 1 heure.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="field-label">Email</label>
        <div className="input-wrap">
          <Mail className="h-[18px] w-[18px] text-muted" />
          <input name="email" type="email" required placeholder="toi@email.com" />
        </div>
      </div>
      <Button type="submit" className="w-full">
        Envoyer le lien <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
