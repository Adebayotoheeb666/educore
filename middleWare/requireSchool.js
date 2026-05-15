const requireSchool = (req, res, next) => {
    if (!req.school) {
        return res.status(403).json({ message: "Access denied. User is not associated with a school." });
    }

    if (req.school.subscription && req.school.subscription.status === 'inactive') {
        return res.status(402).json({ message: "School subscription is inactive. Please renew to access this feature." });
    }

    next();
};

module.exports = requireSchool;
