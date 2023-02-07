module.exports = {
  getHomePage: async (req, res) => {
    try {
      res.render("user/login");
    } catch (error) {
      console.log(error);
    }
  },
};
