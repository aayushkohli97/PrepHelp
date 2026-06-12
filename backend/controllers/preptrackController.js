import PrepTrack from '../models/PrepTrack.js';
import User from '../models/User.js';


// Bet limits per type
const BET_LIMITS = {
  daily:   { min: 100, max: 100 },
  weekly:  { min: 250, max: 500 },
  monthly: { min: 750, max: 1000 }
};

// Duration in ms per type
const DURATION_MS = {
  daily:   24 * 60 * 60 * 1000,
  weekly:  7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000
};

/**
 * POST /api/preptrack/create
 * Create a new PrepTrack draft (tasks + bet, not yet started)
 */
export const createPrepTrack = async (req, res, next) => {
  try {
    const { type, tasks, betAmount } = req.body;

    // Validate type
    if (!type || !['daily', 'weekly', 'monthly'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Must be daily, weekly, or monthly.' });
    }

    // Validate tasks
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: 'At least one task is required.' });
    }

    // Validate bet amount
    const limits = BET_LIMITS[type];
    if (!betAmount || betAmount < limits.min || betAmount > limits.max) {
      return res.status(400).json({
        message: `Bet amount for ${type} must be between ${limits.min} and ${limits.max} coins.`
      });
    }

    const user = await User.findById(req.user.id);
    if ((user.prepCoins || 0) < betAmount) {
      return res.status(400).json({ message: 'Insufficient PrepCoins for this bet.' });
    }

    // Check for existing active track of same type
    const existingActive = await PrepTrack.findOne({
      userId: req.user.id,
      type,
      status: 'active'
    });
    if (existingActive) {
      return res.status(400).json({ message: `You already have an active ${type} PrepTrack.` });
    }

    const track = await PrepTrack.create({
      userId: req.user.id,
      type,
      tasks: tasks.map(t => ({
        description: typeof t === 'string' ? t : t.description,
        isCompleted: false,
        isRolledOver: t.isRolledOver || false
      })),
      betAmount,
      status: 'draft'
    });

    res.status(201).json({ message: 'PrepTrack created as draft.', track });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/preptrack/lock/:id
 * Lock the track, deduct coins, start the timer
 */
export const lockAndStart = async (req, res, next) => {
  try {
    const track = await PrepTrack.findById(req.params.id);
    if (!track) return res.status(404).json({ message: 'PrepTrack not found.' });
    if (String(track.userId) !== req.user.id) return res.status(403).json({ message: 'Not authorized.' });
    if (track.status !== 'draft') return res.status(400).json({ message: 'This track is already locked/started.' });
    if (track.tasks.length === 0) return res.status(400).json({ message: 'Cannot lock a challenge with 0 tasks.' });

    const user = await User.findById(req.user.id);
    if ((user.prepCoins || 0) < track.betAmount) {
      return res.status(400).json({ message: 'Insufficient PrepCoins.' });
    }

    const now = new Date();
    track.startTime = now;
    track.endTime = new Date(now.getTime() + DURATION_MS[track.type]);
    track.status = 'active';

    user.prepCoins = (user.prepCoins || 0) - track.betAmount;
    await user.save();
    await track.save();

    res.status(200).json({
      message: 'PrepTrack locked and started!',
      track,
      prepCoins: user.prepCoins
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/preptrack/edit/:id
 * Edit a draft track's tasks and/or betAmount (only before Lock & Start)
 */
export const editDraft = async (req, res, next) => {
  try {
    const track = await PrepTrack.findById(req.params.id);
    if (!track) return res.status(404).json({ message: 'PrepTrack not found.' });
    if (String(track.userId) !== req.user.id) return res.status(403).json({ message: 'Not authorized.' });
    if (track.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft tracks can be edited. This track is already locked.' });
    }

    const { tasks, betAmount } = req.body;

    // Update tasks if provided
    if (tasks !== undefined) {
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ message: 'Tasks must be an array.' });
      }
      track.tasks = tasks.map(t => ({
        description: typeof t === 'string' ? t : t.description,
        isCompleted: false,
        isRolledOver: t.isRolledOver || false
      }));
    }

    // Update betAmount if provided
    if (betAmount !== undefined) {
      const limits = BET_LIMITS[track.type];
      if (betAmount < limits.min || betAmount > limits.max) {
        return res.status(400).json({
          message: `Bet amount for ${track.type} must be between ${limits.min} and ${limits.max} coins.`
        });
      }

      const user = await User.findById(req.user.id);
      if ((user.prepCoins || 0) < betAmount) {
        return res.status(400).json({ message: 'Insufficient PrepCoins for this bet amount.' });
      }

      track.betAmount = betAmount;
    }

    track.markModified('tasks');
    await track.save();
    res.status(200).json({ message: 'Draft updated successfully.', track });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/preptrack/toggle-task/:id/:taskId
 * Toggle a task's completion status
 */
export const toggleTask = async (req, res, next) => {
  try {
    const track = await PrepTrack.findById(req.params.id);
    if (!track) return res.status(404).json({ message: 'PrepTrack not found.' });
    if (String(track.userId) !== req.user.id) return res.status(403).json({ message: 'Not authorized.' });
    if (track.status !== 'active') return res.status(400).json({ message: 'Track is not active.' });

    const task = track.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    task.isCompleted = !task.isCompleted;
    await track.save();

    res.status(200).json({ message: 'Task toggled.', track });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/preptrack/evaluate/:id
 * AI evaluates the track — triggered on timer expiry or "Submit Early"
 */
export const evaluateTrack = async (req, res, next) => {
  try {
    const track = await PrepTrack.findById(req.params.id);
    if (!track) return res.status(404).json({ message: 'PrepTrack not found.' });
    if (String(track.userId) !== req.user.id) return res.status(403).json({ message: 'Not authorized.' });
    if (track.status !== 'active') return res.status(400).json({ message: 'Track is not active or already evaluated.' });

    // Simple evaluation
    const totalCount = track.tasks.length;
    const completedCount = track.tasks.filter(t => t.isCompleted).length;
    const calculatedPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // ===== EARNING FORMULA =====
    // Score < 50%  → User LOSES their bet (0 coins back)
    // Score >= 50% → User gets bet back + bonus that scales linearly:
    //    At 50%  → bonus = 0          → total = betAmount (1x)
    //    At 75%  → bonus = 50% of bet → total = 1.5x bet
    //    At 100% → bonus = 100% of bet → total = 2x bet
    let earnedCoins;
    if (calculatedPercentage < 50) {
      // Below 50%: you lose your bet entirely
      earnedCoins = 0;
    } else {
      // 50% and above: bet refund + proportional bonus
      const bonusMultiplier = (calculatedPercentage - 50) / 50; // 0 at 50%, 1 at 100%
      const bonus = Math.floor(track.betAmount * bonusMultiplier);
      earnedCoins = track.betAmount + bonus;
    }

    track.completionScore = calculatedPercentage;
    track.earnedCoins = earnedCoins;
    track.aiFeedback = `You completed ${completedCount} out of ${totalCount} tasks.`;
    track.status = calculatedPercentage >= 100 ? 'evaluated' : 'failed';
    track.submittedAt = new Date();

    const { rolloverTaskIds = [] } = req.body || {};

    // === MANUAL ROLLOVER LOGIC ===
    let rolloverTrack = null;
    if (calculatedPercentage < 100) {
      // Mark tasks that were chosen to be rolled over
      track.tasks.forEach(t => {
        if (!t.isCompleted && rolloverTaskIds.includes(String(t._id))) {
          t.rolledOverToNext = true;
        }
      });

      const undoneTasksToRollover = track.tasks
        .filter(t => !t.isCompleted && t.rolledOverToNext)
        .map(t => ({
          description: t.description,
          isCompleted: false,
          isRolledOver: true
        }));

      if (undoneTasksToRollover.length > 0) {
        // Create a draft daily track with the rolled-over tasks
        const submittedDate = new Date(track.startTime || track.createdAt || new Date());
        const nextDayDate = new Date(submittedDate);
        nextDayDate.setDate(submittedDate.getDate() + 1);

        rolloverTrack = await PrepTrack.create({
          userId: req.user.id,
          type: 'daily', // rollover is always to a daily track
          tasks: undoneTasksToRollover,
          betAmount: BET_LIMITS.daily.min,
          status: 'draft',
          createdAt: nextDayDate
        });
      }
    }

    await track.save(); // Save track after updating rolledOverToNext

    // Credit earned coins back to user
    const user = await User.findById(req.user.id);
    user.prepCoins += earnedCoins;
    await user.save();

    res.status(200).json({
      message: 'PrepTrack evaluated by AI.',
      track,
      earnedCoins,
      prepCoins: user.prepCoins,
      rolloverTrack: rolloverTrack || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/preptrack/active
 * Get all active/draft tracks for current user
 */
export const getActiveTracks = async (req, res, next) => {
  try {
    const tracks = await PrepTrack.find({
      userId: req.user.id,
      status: { $in: ['draft', 'active'] }
    }).sort({ createdAt: -1 });

    res.status(200).json(tracks);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/preptrack/history
 * Get evaluated/failed tracks (for graph data)
 */
export const getHistory = async (req, res, next) => {
  try {
    const tracks = await PrepTrack.find({
      userId: req.user.id,
      status: { $in: ['evaluated', 'failed'] }
    }).sort({ createdAt: 1 }).limit(60);

    res.status(200).json(tracks);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/preptrack/:id
 * Delete a draft (un-started) track
 */
export const deleteDraft = async (req, res, next) => {
  try {
    const track = await PrepTrack.findById(req.params.id);
    if (!track) return res.status(404).json({ message: 'PrepTrack not found.' });
    if (String(track.userId) !== req.user.id) return res.status(403).json({ message: 'Not authorized.' });
    if (track.status !== 'draft') return res.status(400).json({ message: 'Only draft tracks can be deleted.' });

    await PrepTrack.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Draft deleted.' });
  } catch (error) {
    next(error);
  }
};
