import { redisGetKeyAsync, redisIncrementKeyValue } from './../../redis/redisHelperFunctions';

// developer API keys are only valid for 100 calls
// they are uuid-v4 for the key, integer for the value

export default function (req, res, next) {
  const token = req.body.token || req.query.token || req.headers['x-access-token'] || null;

  redisGetKeyAsync(token)
    .then(redisToken => {
      if (redisToken) { // if not exist, will return false.
        if (redisToken < 100) {
          redisIncrementKeyValue(token) // add 1 to the token call count
          next();
        } else {
          res.json({ message: 'API key over rate limit, request new key' });
        }
      } else {
        res.json({ message: 'invalid API key' });
      }
    })
    .catch(err => {
      console.warn('error fetching key from redis', err);
    });
};
