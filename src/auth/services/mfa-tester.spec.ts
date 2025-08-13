import * as speakeasy from 'speakeasy';


// const secret = speakeasy.generateSecret({
//   name: 'MyApp',
//   length: 20
// })

const secret = 'PFAXWKSEPJVXCYSBGY2GKPDSNQZEY3SC'
const token = speakeasy.totp({
   secret: secret,
   encoding: 'base32'
})


//const token = '713256'
const tokenValidates = speakeasy.totp.verify({
  secret: secret,
  encoding: 'base32',
  algorithm: 'sha1',
  //digits: 6,
  token: token,
  //window: 30,
  //step: 2
})

console.log(`tokenValidates: ${tokenValidates}`);



