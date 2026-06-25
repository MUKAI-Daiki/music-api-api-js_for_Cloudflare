const BASE_URL = "https://apibox.erweima.ai";
const MODEL = "V4_5PLUS";

const retJSON = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    }
  });
};

const retErr = (msg = "error", status = 400) => {
  return retJSON({ err: msg }, status);
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      }
    });
  }

  const apikey = env.APIKEY;
  const callBackBase = env.CALLBACKBASE;
  const kv = env.MUSIC_CACHE;

  if (!apikey || !callBackBase || !kv) {
    return retErr("Server configuration missing. Please check APIKEY, CALLBACKBASE, and KV bindings.", 500);
  }

  const dec = (name) => {
    const val = url.searchParams.get(name);
    return val ? decodeURIComponent(val) : "";
  };

  const fetchPOST = async (apiPath, json) => {
    const targetUrl = BASE_URL + apiPath;
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": "Bearer " + apikey,
    };
    json.callBackUrl = callBackBase + "/api/callBack";

    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(json),
    });
    const resJson = await res.json();
    if (!resJson.data) {
      throw new Error(resJson.msg || "External API call failed");
    }
    return resJson.data.taskId;
  };

  // GET /api/fetchLyrics
  if (path === "/api/fetchLyrics" && request.method === "GET") {
    const prompt = dec("prompt");
    try {
      const taskId = await fetchPOST("/api/v1/lyrics", { prompt });
      return retJSON(taskId);
    } catch (e) {
      return retErr(e.message);
    }
  }

  // GET /api/fetchGenerateMusicSimple
  if (path === "/api/fetchGenerateMusicSimple" && request.method === "GET") {
    const prompt = dec("prompt");
    const negativeTags = dec("negativeTags");
    try {
      const taskId = await fetchPOST("/api/v1/generate", {
        prompt,
        negativeTags,
        customMode: false,
        instrumental: false,
        model: MODEL,
      });
      return retJSON(taskId);
    } catch (e) {
      return retErr(e.message);
    }
  }

  // GET /api/fetchGenerateMusicCustom
  if (path === "/api/fetchGenerateMusicCustom" && request.method === "GET") {
    const prompt = dec("prompt");
    const style = dec("style");
    const title = dec("title");
    const negativeTags = dec("negativeTags");
    try {
      const taskId = await fetchPOST("/api/v1/generate", {
        prompt,
        style,
        title,
        negativeTags,
        customMode: true,
        instrumental: false,
        model: MODEL,
      });
      return retJSON(taskId);
    } catch (e) {
      return retErr(e.message);
    }
  }

  // GET /api/fetchGenerateMusicCustomInstrumental
  if (path === "/api/fetchGenerateMusicCustomInstrumental" && request.method === "GET") {
    const style = dec("style");
    const title = dec("title");
    const negativeTags = dec("negativeTags");
    try {
      const taskId = await fetchPOST("/api/v1/generate", {
        style,
        title,
        negativeTags,
        customMode: true,
        instrumental: true,
        model: MODEL,
      });
      return retJSON(taskId);
    } catch (e) {
      return retErr(e.message);
    }
  }

  // GET /api/fetchTask
  if (path === "/api/fetchTask" && request.method === "GET") {
    const taskId = dec("taskId");
    if (!taskId) {
      return retErr("need query");
    }
    const cached = await kv.get(taskId);
    if (cached) {
      return new Response(cached, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }
    return retJSON({ err: "not yet" });
  }

  // POST /api/callBack
  if (path === "/api/callBack" && request.method === "POST") {
    try {
      const json = await request.json();
      const taskId = json.data.task_id;
      if (taskId) {
        // Cache in KV for 24 hours (86400 seconds)
        await kv.put(taskId, JSON.stringify(json), { expirationTtl: 86400 });
      }
      return new Response("OK", { status: 200 });
    } catch (e) {
      return retErr("callback failed: " + e.message, 500);
    }
  }

  return retErr("Not Found", 404);
}
