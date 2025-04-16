// app/api/predict/route.ts

export async function POST(request: Request) {
    // const { data_url } = await request.json();
    let data_url;
    try {
      const body = await request.json();
      data_url = body.data_url;
      if (!data_url) throw new Error("Missing data_url");
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
      });
    }
    try {
      const res = await fetch(`${process.env.API_ENDPOINT}/predict-data-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data_url }),
      });
  
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch prediction" }),
          { status: 500 }
        );
      }
  
      const data = await res.json();
  
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Internal server error", details: error }),
        { status: 500 }
      );
    }
  }
  