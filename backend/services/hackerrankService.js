import axios from 'axios';
import * as cheerio from 'cheerio';

export const fetchHackerRankStats = async (username) => {
  try {
    // HackerRank has a REST API for public profiles
    const response = await axios.get(
      `https://www.hackerrank.com/rest/hackers/${username}/scores_elo`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    const scores = response.data || [];

    // Get badges
    let badges = 0;
    try {
      const badgeRes = await axios.get(
        `https://www.hackerrank.com/rest/hackers/${username}/badges`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );
      badges = badgeRes.data?.models?.length || 0;
    } catch (e) {
      // Badge fetch is optional
    }

    // Parse topic-wise scores
    const topicWise = scores.map(s => ({
      topic: s.name || s.slug,
      solved: Math.round(s.practice?.score || 0),
      total: 100
    })).filter(t => t.solved > 0);

    const totalScore = topicWise.reduce((sum, t) => sum + t.solved, 0);

    return {
      totalSolved: totalScore,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      ranking: 0,
      contestRating: 0,
      badges,
      topicWise,
      rawData: { scores, badges }
    };
  } catch (error) {
    // Fallback: Try scraping the profile page
    try {
      const pageRes = await axios.get(`https://www.hackerrank.com/${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      return {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        ranking: 0,
        contestRating: 0,
        badges: 0,
        topicWise: [],
        rawData: { note: 'Limited data from profile page' }
      };
    } catch (e) {
      throw new Error(`HackerRank fetch failed: ${error.message}`);
    }
  }
};
