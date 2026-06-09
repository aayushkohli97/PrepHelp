import Wager from '../models/Wager.js';
import User from '../models/User.js';

export const createWager = async (req, res, next) => {
  try {
    const { type, targetQuestions, betAmount } = req.body;

    if (!type || !targetQuestions || !betAmount) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const user = await User.findById(req.user.id);
    if (user.prepCoins < betAmount) {
      return res.status(400).json({ message: 'Insufficient PrepCoins for this bet' });
    }

    // Set end date based on type
    const now = new Date();
    let endDate = new Date();
    if (type === 'daily') endDate.setDate(now.getDate() + 1);
    else if (type === 'weekly') endDate.setDate(now.getDate() + 7);
    else if (type === 'monthly') endDate.setMonth(now.getMonth() + 1);

    const wager = await Wager.create({
      userId: user._id,
      type,
      targetQuestions,
      betAmount,
      endDate
    });

    user.prepCoins -= betAmount;
    await user.save();

    res.status(201).json({ message: 'Wager created successfully', wager, prepCoins: user.prepCoins });
  } catch (error) {
    next(error);
  }
};

export const getActiveWagers = async (req, res, next) => {
  try {
    const wagers = await Wager.find({ userId: req.user.id, status: 'active' });
    res.status(200).json(wagers);
  } catch (error) {
    next(error);
  }
};

export const resolveWager = async (req, res, next) => {
  try {
    const wager = await Wager.findById(req.params.id);
    if (!wager) return res.status(404).json({ message: 'Wager not found' });
    if (String(wager.userId) !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (wager.status !== 'active') return res.status(400).json({ message: 'Wager already resolved' });

    const { completedQuestions } = req.body;
    wager.completedQuestions = completedQuestions || wager.completedQuestions;

    let percentage = (wager.completedQuestions / wager.targetQuestions) * 100;
    if (percentage > 100) percentage = 100;

    const reward = Math.floor(wager.betAmount * (percentage / 100));
    
    // Evaluate if complete or failed
    if (new Date() > wager.endDate || percentage === 100) {
       wager.status = percentage === 100 ? 'completed' : 'failed';
    }

    await wager.save();

    // Reward user
    if (reward > 0) {
      const user = await User.findById(req.user.id);
      user.prepCoins += reward;
      await user.save();
      return res.status(200).json({ message: 'Wager updated/resolved', wager, reward, prepCoins: user.prepCoins });
    }

    res.status(200).json({ message: 'Wager updated', wager, reward: 0 });
  } catch (error) {
    next(error);
  }
};

export const getWagerHistory = async (req, res, next) => {
  try {
    const wagers = await Wager.find({ userId: req.user.id })
      .sort({ createdAt: 1 })
      .limit(30);
    res.status(200).json(wagers);
  } catch (error) {
    next(error);
  }
};
