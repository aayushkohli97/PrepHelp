import axios from 'axios';
import * as cheerio from 'cheerio';

export const fetchCodeChefStats = async (username) => {
  try {
    const response = await axios.get(`https://www.codechef.com/users/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Check if user exists
    if ($('.err-message').length > 0 || response.status === 404) {
      throw new Error('User not found on CodeChef');
    }

    // Rating
    const ratingText = $('.rating-number').first().text().trim();
    const rating = parseInt(ratingText) || 0;

    // Stars
    const starsEl = $('.rating-star');
    const stars = starsEl.length > 0 ? starsEl.text().trim() : '';

    // Highest rating
    const highestRatingText = $('small').filter(function() {
      return $(this).text().includes('Highest Rating');
    }).text();
    const highestRating = parseInt(highestRatingText.match(/\d+/)?.[0]) || rating;

    // Problems solved - try multiple selectors
    let totalSolved = 0;
    const problemsSection = $('h3:contains("Total Problems Solved")').next().text().trim();
    totalSolved = parseInt(problemsSection) || 0;

    // If that didn't work, try the section-content
    if (totalSolved === 0) {
      $('h5').each(function() {
        const text = $(this).text();
        if (text.includes('Total Problems Solved')) {
          const num = text.match(/\d+/);
          if (num) totalSolved = parseInt(num[0]);
        }
      });
    }

    // Global rank
    const globalRankText = $('.rating-ranks ul li:first-child strong').text();
    const globalRank = parseInt(globalRankText) || 0;

    // Country rank
    const countryRankText = $('.rating-ranks ul li:last-child strong').text();
    const countryRank = parseInt(countryRankText) || 0;

    return {
      totalSolved,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      ranking: globalRank,
      contestRating: rating,
      stars,
      topicWise: [],
      rawData: {
        highestRating,
        countryRank,
        stars
      }
    };
  } catch (error) {
    if (error.message.includes('User not found')) throw error;
    throw new Error(`CodeChef fetch failed: ${error.message}`);
  }
};
