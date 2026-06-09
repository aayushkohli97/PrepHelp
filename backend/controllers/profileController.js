import CodingProfile from '../models/CodingProfile.js';
import User from '../models/User.js';
import { fetchLeetCodeStats } from '../services/leetcodeService.js';
import { fetchCodeChefStats } from '../services/codechefService.js';
import { fetchHackerRankStats } from '../services/hackerrankService.js';
import { fetchCodeforcesStats } from '../services/codeforcesService.js';
import { analyzeProfile } from '../services/geminiService.js';

const scrapers = {
  leetcode: fetchLeetCodeStats,
  codechef: fetchCodeChefStats,
  hackerrank: fetchHackerRankStats,
  codeforces: fetchCodeforcesStats
};

// @route POST /api/profile/fetch
export const fetchAllProfiles = async (req, res) => {
  const { profiles } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (profiles) {
    user.codingProfiles = { ...user.codingProfiles, ...profiles };
    await user.save();
  }

  const results = {};
  const errors = {};

  for (const [platform, username] of Object.entries(profiles)) {
    if (!username || !username.trim()) continue;
    try {
      const scraper = scrapers[platform];
      if (!scraper) { errors[platform] = 'Unsupported platform'; continue; }

      const stats = await scraper(username.trim());

      const profile = await CodingProfile.findOneAndUpdate(
        { userId, platform },
        {
          userId, platform, username: username.trim(),
          stats: {
            totalSolved: stats.totalSolved, easySolved: stats.easySolved,
            mediumSolved: stats.mediumSolved, hardSolved: stats.hardSolved,
            ranking: stats.ranking, contestRating: stats.contestRating,
            stars: stats.stars || '', badges: stats.badges || 0,
            totalProblems: stats.totalProblems || 0, topicWise: stats.topicWise || [],
            ratingWise: stats.ratingWise || []
          },
          lastFetched: new Date(), rawData: stats.rawData
        },
        { upsert: true, new: true }
      );

      // ✅ FIX: Save contestRating to User model for leaderboard sorting
      if (stats.contestRating) {
        await User.findByIdAndUpdate(userId, {
          [`contestRating.${platform}`]: stats.contestRating
        });
      }

      results[platform] = profile;
    } catch (error) {
      errors[platform] = error.message;
    }
  }
  res.json({ profiles: results, errors });
};

// @route POST /api/profile/fetch-single — Add or Update a single profile
export const fetchSingleProfile = async (req, res) => {
  const { platform, username } = req.body;
  const userId = req.user._id;

  if (!platform || !username) {
    return res.status(400).json({ message: 'Platform and username required' });
  }
  const scraper = scrapers[platform];
  if (!scraper) {
    return res.status(400).json({ message: 'Unsupported platform' });
  }

  const stats = await scraper(username.trim());

  const profile = await CodingProfile.findOneAndUpdate(
    { userId, platform },
    {
      userId, platform, username: username.trim(),
      stats: {
        totalSolved: stats.totalSolved, easySolved: stats.easySolved,
        mediumSolved: stats.mediumSolved, hardSolved: stats.hardSolved,
        ranking: stats.ranking, contestRating: stats.contestRating,
        stars: stats.stars || '', badges: stats.badges || 0,
        totalProblems: stats.totalProblems || 0, topicWise: stats.topicWise || [],
        ratingWise: stats.ratingWise || []
      },
      lastFetched: new Date(), rawData: stats.rawData
    },
    { upsert: true, new: true }
  );

  // ✅ FIX: Save contestRating + username to User model for leaderboard sorting
  await User.findByIdAndUpdate(userId, {
    [`codingProfiles.${platform}`]: username.trim(),
    ...(stats.contestRating && {
      [`contestRating.${platform}`]: stats.contestRating
    })
  });

  res.json(profile);
};

// @route POST /api/profile/remove — Remove a profile (requires password)
export const removeProfile = async (req, res) => {
  const { platform, password } = req.body;
  const userId = req.user._id;
  if (!platform || !password) {
    return res.status(400).json({ message: 'Platform and password are required' });
  }
  const user = await User.findById(userId).select('+password');
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Incorrect password' });
  }
  await CodingProfile.findOneAndDelete({ userId, platform });

  // ✅ FIX: Also clear contestRating from User model on profile remove
  user.codingProfiles[platform] = '';
  user.contestRating[platform]  = 0;
  await user.save();

  res.json({ message: `${platform} profile removed successfully` });
};

// @route POST /api/profile/verify-password — Verify password before update
export const verifyPassword = async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password is required' });
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });
  res.json({ verified: true });
};

// @route GET /api/profile/stats — UNTOUCHED
export const getProfileStats = async (req, res) => {
  const profiles = await CodingProfile.find({ userId: req.user._id });
  res.json(profiles);
};

// @route GET /api/profile/analysis — UNTOUCHED
export const getProfileAnalysis = async (req, res) => {
  const profiles = await CodingProfile.find({ userId: req.user._id });
  if (!profiles.length) {
    return res.status(400).json({ message: 'No coding profiles found. Add your usernames first.' });
  }

  const aggregated = {
    platforms: {}, totalSolved: 0, totalEasy: 0, totalMedium: 0, totalHard: 0,
    allTopics: {}, contestRatings: {}
  };

  profiles.forEach(p => {
    aggregated.platforms[p.platform] = {
      username: p.username, totalSolved: p.stats.totalSolved,
      easy: p.stats.easySolved, medium: p.stats.mediumSolved,
      hard: p.stats.hardSolved, rating: p.stats.contestRating, ranking: p.stats.ranking
    };
    aggregated.totalSolved += p.stats.totalSolved;
    aggregated.totalEasy += p.stats.easySolved;
    aggregated.totalMedium += p.stats.mediumSolved;
    aggregated.totalHard += p.stats.hardSolved;
    aggregated.contestRatings[p.platform] = p.stats.contestRating;
    (p.stats.topicWise || []).forEach(t => {
      if (!aggregated.allTopics[t.topic]) aggregated.allTopics[t.topic] = 0;
      aggregated.allTopics[t.topic] += t.solved;
    });
  });

  const analysis = await analyzeProfile(aggregated);
  if (analysis.placementScore) {
    await User.findByIdAndUpdate(req.user._id, { placementScore: analysis.placementScore });
  }
  res.json({ aggregated, analysis });
};