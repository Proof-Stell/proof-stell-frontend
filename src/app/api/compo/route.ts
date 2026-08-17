import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAppRouteErrorHandling } from "@/lib/api/appRouteHandler";

const bodySchema = z.object({
  component: z.string().min(1).max(100).optional(),
});

async function getHandler(req: NextRequest) {
  const requestId = "generated-in-wrapper";
  return NextResponse.json({
    success: true,
    data: { name: "Component returned" },
    requestId,
  });
}

async function postHandler(req: NextRequest) {
  const requestId = "generated-in-wrapper";
  const body = await req.json().catch(() => ({}));
  const { component } = bodySchema.parse(body);

  return NextResponse.json({
    success: true,
    data: { name: component ?? "Component returned" },
    requestId,
  });
}

export const GET = withAppRouteErrorHandling(getHandler);
export const POST = withAppRouteErrorHandling(postHandler);
