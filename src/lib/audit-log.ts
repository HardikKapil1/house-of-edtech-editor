// src/lib/audit-log.ts
import { AuditAction, Prisma } from "@/generated/prisma";
import { prisma } from "./prisma";

interface CreateAuditLogParams {
  action: AuditAction;
  documentId: string;
  userId: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createAuditLog(
  { action, documentId, userId, metadata }: CreateAuditLogParams,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await client.auditLog.create({
    data: {
      action,
      documentId,
      userId,
      metadata,
    },
  });
}
