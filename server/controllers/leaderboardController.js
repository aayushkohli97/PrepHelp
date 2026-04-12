import User from '../models/User.js';
import Rival from '../models/Rival.js';

// ✅ Helper: Valid platforms
const VALID_PLATFORMS = ['leetcode', 'codeforces', 'codechef', 'hackerrank'];

export const getGlobalLeaderboard = async (req, res, next) => {
  try {
    // ✅ Read platform from query param, default to 'leetcode'
    const platform = VALID_PLATFORMS.includes(req.query.platform)
      ? req.query.platform
      : 'leetcode';

    const ratingField = `contestRating.${platform}`;

    // ✅ Fetch users sorted by contestRating of selected platform (DESCENDING)
    const topUsers = await User.find({})
      .select(`name avatar codingProfiles contestRating placementScore`)
      .sort({ [ratingField]: -1 })
      .limit(100);

    // ✅ Calculate maxRating for bar width calculation on frontend
    const maxRating = topUsers.length > 0
      ? topUsers[0].contestRating?.[platform] || 1
      : 1;

    // ✅ Format response
    const formatted = topUsers.map((user, index) => ({
      _id:    user._id,
      name:   user.name,
      avatar: user.avatar,
      handle: user.codingProfiles?.[platform] || '',
      rating: user.contestRating?.[platform] || 0,
      rank:   index + 1,
    }));

    res.status(200).json({ users: formatted, maxRating, platform });
  } catch (error) {
    next(error);
  }
};

export const getRivalsLeaderboard = async (req, res, next) => {
  try {
    // ✅ Read platform from query param, default to 'leetcode'
    const platform = VALID_PLATFORMS.includes(req.query.platform)
      ? req.query.platform
      : 'leetcode';

    // ✅ Current user with contestRating
    const currentUser = await User.findById(req.user.id)
      .select('name avatar codingProfiles contestRating placementScore');

    // ✅ Get all rivals with contestRating populated
    const rivals = await Rival.find({ user: req.user.id })
      .populate('rival', 'name avatar codingProfiles contestRating placementScore');

    const rivalUsers = rivals.map(r => r.rival);
    const combined  = [currentUser, ...rivalUsers];

    // ✅ Sort by contestRating of selected platform (DESCENDING)
    combined.sort((a, b) => {
      const ratingA = a.contestRating?.[platform] || 0;
      const ratingB = b.contestRating?.[platform] || 0;
      return ratingB - ratingA;
    });

    // ✅ Calculate maxRating
    const maxRating = combined.length > 0
      ? combined[0].contestRating?.[platform] || 1
      : 1;

    // ✅ Format response
    const formatted = combined.map((user, index) => ({
      _id:          user._id,
      name:         user.name,
      avatar:       user.avatar,
      handle:       user.codingProfiles?.[platform] || '',
      rating:       user.contestRating?.[platform] || 0,
      rank:         index + 1,
      isCurrentUser: String(user._id) === String(req.user.id),
    }));

    res.status(200).json({ users: formatted, maxRating, platform });
  } catch (error) {
    next(error);
  }
};

// ✅ addRival & removeRival — UNTOUCHED
export const addRival = async (req, res, next) => {
  try {
    const { handle } = req.body;

    const rivalUser = await User.findOne({
      $or: [
        { name:  new RegExp('^' + handle + '$', 'i') },
        { email: new RegExp('^' + handle + '$', 'i') }
      ]
    });

    if (!rivalUser) {
      return res.status(404).json({ message: 'User not found. Try searching their exact name or email.' });
    }

    if (String(rivalUser._id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot add yourself as a rival.' });
    }

    const exists = await Rival.findOne({ user: req.user.id, rival: rivalUser._id });
    if (exists) {
      return res.status(400).json({ message: 'This user is already your rival!' });
    }

    await Rival.create({ user: req.user.id, rival: rivalUser._id });

    res.status(201).json({ message: 'Rival added successfully!', rival: rivalUser });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'This user is already your rival!' });
    next(error);
  }
};

export const removeRival = async (req, res, next) => {
  try {
    await Rival.findOneAndDelete({ user: req.user.id, rival: req.params.id });
    res.status(200).json({ message: 'Rival removed.' });
  } catch (error) {
    next(error);
  }
};