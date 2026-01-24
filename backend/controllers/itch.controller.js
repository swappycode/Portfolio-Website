
import { ITCH_GAMES } from "../config/itch.js";
import { GITHUB_TOKEN } from "../config/env.js";
import gitRepoData, { githubUsername } from "../config/github.js";

/* =========================
   LIST PAGE
   ========================= */
export const iList = async (req, res, next) => {
  try {
    const response = await fetch(ITCH_GAMES);
    const data = await response.json();

    if (!data || !data.games) {
      const error = new Error("Invalid itch.io response");
      error.status = 500;
      throw error;
    }

    const games = [];

    for (const game of data.games) {
      const slug = game.url.split("/").pop();

      games.push({
        id: game.id,
        slug,
        title: game.title,
        description: game.short_text || "",
        cover: game.cover_url || null,
        url: game.url,
        stats: {
          views: game.views_count,
          downloads: game.downloads_count,
          purchases: game.purchases_count
        },
        platforms: {
          windows: game.p_windows,
          linux: game.p_linux,
          mac: game.p_osx,
          android: game.p_android
        }
      });
    }

    res.status(200).json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    next(error);
  }
};

/* =========================
   DETAIL PAGE (OPTIMIZED)
   ========================= */
export const iDetail = async (req, res, next) => {
  try {
    const { slug } = req.params;

    /* ---------- 1. ITCH.IO FETCH ---------- */
    const itchResponse = await fetch(ITCH_GAMES);
    const itchData = await itchResponse.json();

    if (!itchData || !itchData.games) {
      const error = new Error("Invalid itch.io response");
      error.status = 500;
      throw error;
    }

    const game = itchData.games.find(
      (g) => g.url.split("/").pop() === slug
    );

    if (!game) {
      const error = new Error("Game not found on Itch.io");
      error.status = 404;
      throw error;
    }

    /* ---------- 2. GITHUB FETCH (DIRECT) ---------- */
    // Step A: Get the GitHub User (Owner of the token)
    // We need this to build the repo URL: repos/{owner}/{repo}
const userRes = await fetch("https://api.github.com/user", {
  headers: {
    // Change 'Bearer' to 'token'
    Authorization: `token ${GITHUB_TOKEN}`, 
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-backend"
  }
});

    if (!userRes.ok) {
        throw new Error("Failed to verify GitHub user");
    }
    
    const userData = await userRes.json();
    const githubUsername = userData.login;

    // Step B: Fetch the specific repository metadata
    // This works for PRIVATE repos if the token has 'repo' scope
    const repoRes = await fetch(
      `https://api.github.com/repos/${githubUsername}/${slug}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "portfolio-backend",
        },
      }
    );

    if (!repoRes.ok) {
      // If 404, it means it doesn't exist OR the token can't see it
      const error = new Error("Repository not found or private access denied");
      error.status = 404;
      throw error;
    }

    const repoData = await repoRes.json();

    /* ---------- 3. README FETCH ---------- */
    const readmeResponse = await fetch(
      `https://api.github.com/repos/${githubUsername}/${slug}/readme`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "portfolio-backend",
        },
      }
    );

    let readmeContent = "";
    if (readmeResponse.ok) {
      const readmeData = await readmeResponse.json();
      readmeContent = Buffer.from(readmeData.content, "base64").toString("utf-8");
    }

    /* ---------- 4. RESPONSE ---------- */
    res.status(200).json({
      success: true,
      data: {
        id: game.id,
        slug,
        title: game.title,
        description: game.short_text || "",
        cover: game.cover_url || null,
        url: game.url,
        stats: {
          views: game.views_count,
          downloads: game.downloads_count,
          purchases: game.purchases_count,
        },
        platforms: {
          windows: game.p_windows,
          linux: game.p_linux,
          mac: game.p_osx,
          android: game.p_android,
        },
        pricing: {
          min_price: game.min_price,
          earnings: game.earnings || [],
        },
        published: {
          published: game.published,
          published_at: game.published_at,
          created_at: game.created_at,
        },
        // GitHub specific data
        github: {
            stars: repoData.stargazers_count,
            forks: repoData.forks_count,
            language: repoData.language,
            html_url: repoData.html_url
        },
        readme: readmeContent,
        download_page: game.url,
      },
    });
  } catch (error) {
    next(error);
  }
};