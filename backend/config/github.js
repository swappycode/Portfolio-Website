
// Import GitHub token from environment configuration
import { GITHUB_TOKEN } from './env.js';

// Define the GitHub username to fetch repositories for
export const githubUsername = 'swappycode';

const gitRepoData = async (req, res) => {

    try {
        // Make a GET request to GitHub API to fetch user repositories
        const githubResponse = await fetch(
            `https://api.github.com/users/${githubUsername}/repos`,
            {
                headers: {
                    // Include GitHub token for authentication
                    Authorization: `token ${GITHUB_TOKEN}`,
                    // Specify API version for GitHub
                    Accept: "application/vnd.github+json"
                }
            }
        );

        // Check if the API request was successful (status 200-299)
        if (!githubResponse.ok) {
            // Create a custom error with the HTTP status code
            const error = new Error('Unable to Fetch Data from GitHub API');
            error.status = githubResponse.status;
            throw error;
        }

        // Parse the JSON response from the API
        const data = await githubResponse.json();
        // Return the repository data
        return {githubUsername,data};

    } catch (error) {
        // Log any errors that occur during the API call
        console.error('GitHub API Error:', error.message);
        // Re-throw the error to be handled by calling code
        throw error;
    }
};

// Export the function as the default export
export default gitRepoData;
