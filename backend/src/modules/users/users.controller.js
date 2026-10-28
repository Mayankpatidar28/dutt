import { usersService } from './users.service.js';

export async function getProfile(req, res, next) {
  try {
    const profile = await usersService.getProfile(req.user.id);
    res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const updated = await usersService.updateProfile(req.user.id, req.body);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
