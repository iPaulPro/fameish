import { jwtVerify, createRemoteJWKSet } from "jose";
import { lensClient } from "@/lib/lens/server";
import supabase from "@/lib/supabase/admin";

const jwksUri = process.env.LENS_JWKS_URI!;
const JWKS = createRemoteJWKSet(new URL(jwksUri));

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];

  if (!token) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const body = await req.json();
  const { account } = body;

  try {
    // Verify the JWT using the JWKS
    const { payload } = await jwtVerify(token, JWKS);
    const { sub: signer, act: account } = payload;

    // TODO Check if the signer is a manager or owner of the account

    // TODO Check if the account already exists in the database
    // const userQuery = supabase
    //   .from("users")

    // TODO Create the account in the database
  } catch (e) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  return Response.json({ success: true });
}
