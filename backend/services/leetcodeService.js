import axios from 'axios';

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

const USER_PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
        starRating
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      tagProblemCounts {
        advanced {
          tagName
          problemsSolved
        }
        intermediate {
          tagName
          problemsSolved
        }
        fundamental {
          tagName
          problemsSolved
        }
      }
    }
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      topPercentage
    }
  }
`;

export const fetchLeetCodeStats = async (username) => {
  try {
    const response = await axios.post(LEETCODE_GRAPHQL, {
      query: USER_PROFILE_QUERY,
      variables: { username }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com'
      },
      timeout: 10000
    });

    const data = response.data?.data;
    if (!data?.matchedUser) {
      throw new Error('User not found on LeetCode');
    }

    const user = data.matchedUser;
    const submissions = user.submitStatsGlobal?.acSubmissionNum || [];
    const contest = data.userContestRanking;

    // Parse difficulty counts
    let easySolved = 0, mediumSolved = 0, hardSolved = 0, totalSolved = 0;
    submissions.forEach(sub => {
      if (sub.difficulty === 'Easy') easySolved = sub.count;
      else if (sub.difficulty === 'Medium') mediumSolved = sub.count;
      else if (sub.difficulty === 'Hard') hardSolved = sub.count;
      else if (sub.difficulty === 'All') totalSolved = sub.count;
    });

    // Parse topic-wise stats
    const topicWise = [];
    const allTags = [
      ...(user.tagProblemCounts?.fundamental || []),
      ...(user.tagProblemCounts?.intermediate || []),
      ...(user.tagProblemCounts?.advanced || [])
    ];
    allTags.forEach(tag => {
      topicWise.push({
        topic: tag.tagName,
        solved: tag.problemsSolved,
        total: tag.problemsSolved // We don't have total, so we set solved as reference
      });
    });

    // Sort by most solved
    topicWise.sort((a, b) => b.solved - a.solved);

    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      ranking: user.profile?.ranking || 0,
      contestRating: Math.round(contest?.rating || 0),
      totalProblems: 3400, // approx total on LeetCode
      topicWise: topicWise.slice(0, 20), // top 20 topics
      rawData: {
        profile: user.profile,
        contest,
        topPercentage: contest?.topPercentage
      }
    };
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('LeetCode rate limit reached. Try again later.');
    }
    throw new Error(`LeetCode fetch failed: ${error.message}`);
  }
};
