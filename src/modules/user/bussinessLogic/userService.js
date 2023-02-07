const userRepository = require("../repository/noSqlRepository/userRepository");
module.exports = {
  verifyEmailAddress: async (userId, uniqueString) => {
    return await userRepository.verifyEmailAddress(userId, uniqueString);
  },

  updateUser: async (userDetails, res) => {
    let NOSQLMode = 1;
    if (userDetails._id) {
      // check if data is already exist, if exist it will be overwritten
      NOSQLMode = 2;
    } else if (userDetails.recordStatusId === 3) {
      // mark us deleted
      NOSQLMode = 3;
    }
    return await userRepository.updateUser(userDetails, NOSQLMode, res);
  },
};
