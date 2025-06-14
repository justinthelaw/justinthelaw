import { useEffect, useState } from "react";

export default function GitHubProfileDescription() {
  const [bio, setBio] = useState("");

  useEffect(() => {
    const fetchGitHubBio = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/users/justinthelaw"
        );
        const data = await response.json();
        if (data.bio) {
          setBio(data.bio);
        }
      } catch (error) {
        console.error("Error fetching GitHub Bio:", error);
      }
    };

    fetchGitHubBio();
  }, []);

  return (
    <p className="text-center text-sm sm:text-sm md:text-base lg:text-base mx-4">
      {bio}
    </p>
  );
}
