const loginRepository = require("../repository/noSqlRepository/loginRepository");
module.exports = {
  checkLogin: async (userDetails) => {
    return await loginRepository.checkLogin(userDetails);
  },
};
