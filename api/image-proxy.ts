import { NowRequest, NowResponse } from "@now/node";
import fetch from "node-fetch";

export default async (request: NowRequest, response: NowResponse) => {
  const { url } = request.query;
  const imageURL = Array.isArray(url) ? url[0] : url;
  if (!imageURL) {
    return response.status(400).send("Error: No url from param");
  }

  try {
    new URL(imageURL);
  } catch (e) {
    return response.status(400).send("Error: Invalid URL string");
  }

  const res = await fetch(imageURL, {
    headers: {
      "User-Agent": request.headers["user-agent"],
      Referer: new URL(imageURL).origin,
    },
    redirect: "follow",
  });

  if (res.status >= 400) {
    return response.status(res.status).send(await res.text());
  }

  if (res.headers.get("Content-Type").split("/")[0].toLowerCase() !== "image") {
    return response.status(400).send("Error: Content-Type is not image");
  }

  response.setHeader("Content-Type", res.headers.get("Content-Type"));

  return response.status(200).send(await res.buffer());
};
