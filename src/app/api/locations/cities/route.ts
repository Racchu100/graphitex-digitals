import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state_id = searchParams.get('state_id');

    if (!state_id) {
       return NextResponse.json({ error: "state_id is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .eq("state_id", state_id)
      .order("name");

    if (error) throw error;

    return NextResponse.json({ cities: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
