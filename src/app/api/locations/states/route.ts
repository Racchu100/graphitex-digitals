import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country_id = searchParams.get('country_id');

    if (!country_id) {
       return NextResponse.json({ error: "country_id is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from("states")
      .select("*")
      .eq("country_id", country_id)
      .order("name");

    if (error) throw error;

    return NextResponse.json({ states: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
