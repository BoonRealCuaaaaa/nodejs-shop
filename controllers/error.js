const error404 = (req, res, next) => {
  res.render("404", {
    pageTitle: "Page not found",
    path: "/404",
    isAuthenticated: req.session.isLoggedIn,
  });
  res.status(404);
};

const error500 = (req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
};
export default { error404,error500 };
