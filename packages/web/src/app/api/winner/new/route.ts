export const maxDuration = 60; // This function can run for a maximum of 60 seconds

export function GET(request: Request) {
  // https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  return Response.json({ success: true });
}
