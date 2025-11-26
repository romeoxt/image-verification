'use server'

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function revokeDevice(deviceId: string) {
  // Insert into revocations
  // The trigger 'revocations_set_device_revoked_at_trigger' will automatically 
  // update the devices.revoked_at field.
  await query(
    `INSERT INTO revocations (device_id, reason, revoked_by) 
     VALUES ($1, $2, $3)`,
    [deviceId, "Revoked by admin dashboard", "admin"]
  );

  revalidatePath('/dashboard/devices');
}


