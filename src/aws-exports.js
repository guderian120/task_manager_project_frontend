const awsconfig = {
  Auth: {
    region: 'eu-west-1', // Or your region
    userPoolId: 'eu-west-1_QDsMmLqjq',            // From `create-user-pool`
    userPoolWebClientId: '1airmlbagr92cjq1940jp3amqn', // From `create-user-pool-client`
    authenticationFlowType: 'USER_PASSWORD_AUTH',
    mandatorySignIn: false
  }
}

export default awsconfig
