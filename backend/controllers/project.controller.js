/**
 * Controller for handling project-related operations
 * This module manages portfolio project data retrieval and processing
 */

// Import the GitHub repository data fetching function and username
import gitRepoData, { githubUsername } from "../config/github.js";


 //Get list of portfolio projects from GitHub repositories
 // Filters repositories that are not forks and have "portfolio" topic

export const List = async (req, res, next) => {
    try {
        // Fetch all repositories from GitHub API
        const { githubUsername, data: repositories } = await gitRepoData();

        // Initialize array to store filtered portfolio projects
        const projects = [];

        // Iterate through each repository to filter and format portfolio projects
        for (const repo of repositories) {
            // Skip forked repositories (we only want original projects)
            if (repo.fork) continue;

            // Skip repositories that don't have topics or don't include "portfolio" topic
            if (!repo.topics || !repo.topics.includes("portfolio")) continue;

            // Add the repository to projects array with formatted data
            projects.push({
                name: repo.name,
                description: repo.description,
                tags: repo.topics,
                githubUrl: repo.html_url,
                imageUrl: `https://raw.githubusercontent.com/${githubUsername}/${repo.name}/main/assets/preview.png`
            });
        }

        // Send successful response with the filtered projects
        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });

    } catch (error) {
        // Log the error for debugging purposes
        console.error('Error fetching portfolio projects:', error.message);

        // Pass the error to the next middleware for centralized error handling
        next(error);
    }
};
