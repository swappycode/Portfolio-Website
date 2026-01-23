/**
 * Controller for handling project-related operations
 * This module manages portfolio project data retrieval and processing
 */

// Import the GitHub repository data fetching function and username
import { GITHUB_TOKEN } from "../config/env.js";
import gitRepoData, { githubUsername } from "../config/github.js";


 //Get list of portfolio projects from GitHub repositories
 // Filters repositories that are not forks and have "portfolio" topic

export const gList = async (req, res, next) => {
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


export const gDetail = async (req, res, next) => {
    try {
        const { githubUsername, data: repositories } = await gitRepoData();
        const repoName = req.params.name;
        const repoData = repositories.find(repo => repo.name === repoName);

        if (!repoData) {
            const error = new Error('Unable to find the repository');
            error.status = 404
            throw error
        }

        const readmeResponse = await fetch(`https://api.github.com/repos/${githubUsername}/${repoName}/readme`, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json"
            }
        });

        let readmeContent = "";
        if (readmeResponse.ok) {
            const readmeData = await readmeResponse.json();
            readmeContent = Buffer
                .from(readmeData.content, "base64")
                .toString("utf-8");
        }

        res.status(200).json({
            name: repoData.name,
            description: repoData.description,
            language: repoData.language,
            tags: repoData.topics,
            stars: repoData.stargazers_count,
            forks: repoData.forks_count,
            githubUrl: repoData.html_url,
            homepage: repoData.homepage,
            previewImage: `https://raw.githubusercontent.com/${githubUsername}/${repoName}/main/assets/preview.png`,
            readme: readmeContent
        });
    } catch (error) {
        console.error('Error fetching project details:', error);
        next(error);
    }
};
