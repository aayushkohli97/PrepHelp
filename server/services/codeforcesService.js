import axios from 'axios';

// Codeforces has an official public API!
const CF_API = 'https://codeforces.com/api';

export const fetchCodeforcesStats = async (username) => {
  try {
    // Fetch user info
    const userRes = await axios.get(`${CF_API}/user.info`, {
      params: { handles: username },
      timeout: 10000
    });

    if (userRes.data.status !== 'OK') {
      throw new Error('User not found on Codeforces');
    }

    const user = userRes.data.result[0];

    // Fetch user submissions to calculate problem stats
    const submissionsRes = await axios.get(`${CF_API}/user.status`, {
      params: { handle: username, from: 1, count: 10000 },
      timeout: 15000
    });

    const submissions = submissionsRes.data.result || [];

    // Count unique solved problems by difficulty and rating buckets
    const solvedSet = new Set();
    const topicMap = {};
    const ratingBuckets = {};
    let easySolved = 0, mediumSolved = 0, hardSolved = 0;

    submissions.forEach(sub => {
      if (sub.verdict === 'OK') {
        const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
        if (!solvedSet.has(problemKey)) {
          solvedSet.add(problemKey);
          const rating = sub.problem.rating || 0;

          if (rating <= 1200) easySolved++;
          else if (rating <= 1800) mediumSolved++;
          else if (rating > 1800) hardSolved++;

          // Rating bucket counting (800+)
          if (rating >= 800) {
            let bucket = Math.floor(rating / 100) * 100;
            if (bucket > 2100) bucket = 2100; // Cap at 2100 for the 2100+ bucket
            if (!ratingBuckets[bucket]) ratingBuckets[bucket] = 0;
            ratingBuckets[bucket]++;
          }

          // Topic-wise counting
          (sub.problem.tags || []).forEach(tag => {
            if (!topicMap[tag]) topicMap[tag] = 0;
            topicMap[tag]++;
          });
        }
      }
    });

    // Build ratingWise array
    const ratingWise = [];
    for (let r = 800; r <= 2100; r += 100) {
      ratingWise.push({ rating: r, count: ratingBuckets[r] || 0 });
    }

    const topicWise = Object.entries(topicMap)
      .map(([topic, solved]) => ({ topic, solved, total: solved }))
      .sort((a, b) => b.solved - a.solved)
      .slice(0, 20);

    // Fetch rating history
    let ratingHistory = [];
    try {
      const ratingRes = await axios.get(`${CF_API}/user.rating`, {
        params: { handle: username },
        timeout: 10000
      });
      ratingHistory = ratingRes.data.result || [];
    } catch (e) {
      // rating history is optional
    }

    return {
      totalSolved: solvedSet.size,
      easySolved,
      mediumSolved,
      hardSolved,
      ranking: user.rating || 0,
      contestRating: user.maxRating || 0,
      topicWise,
      ratingWise,
      rawData: {
        rank: user.rank,
        maxRank: user.maxRank,
        rating: user.rating,
        maxRating: user.maxRating,
        contribution: user.contribution,
        friendOfCount: user.friendOfCount,
        contestsCount: ratingHistory.length,
        avatar: user.titlePhoto
      }
    };
  } catch (error) {
    if (error.response?.data?.comment?.includes('not found')) {
      throw new Error('User not found on Codeforces');
    }
    throw new Error(`Codeforces fetch failed: ${error.message}`);
  }
};
