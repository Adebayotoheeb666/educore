// Injects school filter into mongoose query options to prevent cross-school data leakage.
// Attach after protect + requireSchool. Controllers can call req.schoolFilter() to get { school: req.school._id }.
const schoolScopeMiddleware = (req, res, next) => {
  if (!req.school) return res.status(403).json({ message: 'School context required' });
  req.schoolFilter = () => ({ school: req.school._id });
  next();
};

module.exports = schoolScopeMiddleware;
