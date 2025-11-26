'use client'

import { Button } from "@/components/ui/button";
import { revokeDevice } from "@/app/actions";
import { useState } from "react";

export function DeviceActions({ deviceId, isRevoked }: { deviceId: string, isRevoked: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    if (!confirm("Are you sure you want to revoke this device? This action cannot be undone.")) return;
    
    setLoading(true);
    try {
      await revokeDevice(deviceId);
    } catch (e) {
      console.error(e);
      alert("Failed to revoke device");
    } finally {
      setLoading(false);
    }
  }

  if (isRevoked) {
    return <Button variant="ghost" size="sm" disabled className="text-destructive">Revoked</Button>;
  }

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      onClick={handleRevoke}
      disabled={loading}
    >
      {loading ? "Revoking..." : "Revoke"}
    </Button>
  );
}


