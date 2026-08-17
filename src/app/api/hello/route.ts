import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAppRouteErrorHandling } from "@/lib/api/appRouteHandler";

const querySchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

async function handler(req: NextRequest) {
  const requestId = "generated-in-wrapper";
  
  const searchParams = req.nextUrl.searchParams;
  const nameQuery = searchParams.get("name") ?? undefined;
  
  const { name } = querySchema.parse({ name: nameQuery });

  return NextResponse.json({
    success: true,
    data: { name: name ?? "John Doe" },
    requestId,
  });
}

export const GET = withAppRouteErrorHandling(handler);
