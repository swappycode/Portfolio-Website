
import { ITCH_GAMES } from "../config/itch.js";

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
   DETAIL PAGE
   ========================= */
export const iDetail = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const response = await fetch(ITCH_GAMES);
    const data = await response.json();

    if (!data || !data.games) {
      const error = new Error("Invalid itch.io response");
      error.status = 500;
      throw error;
    }

    const game = data.games.find(
      g => g.url.split("/").pop() === slug
    );

    if (!game) {
      const error = new Error("Game not found");
      error.status = 404;
      throw error;
    }

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
          purchases: game.purchases_count
        },

        platforms: {
          windows: game.p_windows,
          linux: game.p_linux,
          mac: game.p_osx,
          android: game.p_android
        },

        pricing: {
          min_price: game.min_price,
          earnings: game.earnings || []
        },

        published: {
          published: game.published,
          published_at: game.published_at,
          created_at: game.created_at
        },

        download_page: game.url // 👈 THIS IS THE DOWNLOAD
      }
    });
  } catch (error) {
    next(error);
  }
};
