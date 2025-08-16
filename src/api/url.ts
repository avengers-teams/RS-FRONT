enum ApiUrl {
  Register = '/auth/register',
  UserRegister = '/user/register',
  Login = '/auth/login',
  Logout = '/auth/logout',
  UserMe = '/user/me',

  Conversation = '/conv',
  AllConversation = '/conv/all',
  UserList = '/user',

  VerifyLog = '/verify/log',
  VerifyLogFiles = '/verify/log_files',
  VerifyUnpackedTree = '/verify/unpacked/tree',
  VerifyRun = '/verify/run',
}

export default ApiUrl;
