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

  if (["image", "video"].includes(res.headers.get("Content-Type").split("/")[0].toLowerCase())) {
    response.setHeader("Content-Type", res.headers.get("Content-Type"));
  } else if (res.headers.get("Content-Type").toLowerCase() === "application/octet-stream") {
    const match = imageURL.match(/\.(\w{3,4})($|\?)/);
    if (!match) return response.status(400).send("Error: Cannot determine Content-Type");
    const contentType = {
      mp4: "video/mp4",
      mpeg: "video/mpeg",
      webm: "video/webm",
      mkv: "video/x-matroska",
      bmp: "image/bmp",
      gif: "image/gif",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    }[match[1]];
    if (!contentType) return response.status(400).send("Error: Unknown Content-Type");
    response.setHeader("Content-Type", contentType);
  } else {
    return response.status(400).send("Error: Unsupported Content-Type");
  }

  return response.status(200).send(await res.buffer());
};
