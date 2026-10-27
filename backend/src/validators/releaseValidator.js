function validateCreateRelease(req, res, next) {
  const { appName, version, previousStableVersion, candidateVersion } = req.body;

  const errors = [];

  if (!appName || typeof appName !== 'string' || appName.trim().length === 0) {
    errors.push('appName is required and must be a non-empty string');
  }

  const ver = candidateVersion || version;
  if (!ver || typeof ver !== 'string' || ver.trim().length === 0) {
    errors.push('candidateVersion (or version) is required and must be a non-empty string');
  }

  if (!previousStableVersion || typeof previousStableVersion !== 'string' || previousStableVersion.trim().length === 0) {
    errors.push('previousStableVersion is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

module.exports = {
  validateCreateRelease
};
