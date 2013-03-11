/**
 *  
**/
var user_parent = {};
var user_metrics = [];
var status_metrics = [];


exports.node = function(obj) {
  user_parent = obj;
}

exports.link = function(obj) {
  setValue('link', obj);
}

exports.total = function(obj) {
  setValue('total', obj);
}

exports.count = function(obj) {
  setValue('count', obj);
}

exports.user = function() {
  return user_metrics;
}

exports.status = function() {
  return status_metrics;
}


function setValue(type, obj) {
  var i, x, atom, val = {};
  
  for(x in obj) {
    if(x !== 'uid' && x !== 'sid') {
      val[x+'_'+type] = obj[x];
    }
  }
  
  if(typeof obj.sid !== 'undefined') {
    i = findValue(status_metrics, 'sid', obj.sid);
    if(i === -1) {
      atom = {
        sid: obj.sid,
        uid: 0,
        weight: 0,
        repost_link: 0,
        comment_total: 0,
        comment_count: 0,
        repost_total: 0,
        repost_count: 0
      };
      i = status_metrics.length;
      status_metrics.push(atom);
    }
    
    if(type === 'total') {
      for(x in val) {
        if(typeof status_metrics[i][x] !== 'undefined') status_metrics[i][x] = val[x];
      }
    } else if(type === 'count') {
      for(x in val) {
        if(typeof status_metrics[i][x] !== 'undefined') status_metrics[i][x] += val[x];
      }
    }
  } else {
    i = findValue(user_metrics, 'uid', obj.uid);
    if(i === -1) {
      atom = {
        uid: obj.uid,
        weight: 0,
        friend_link: 0,
        follower_link: 0,
        friend_total: 0,
        friend_count: 0,
        follower_total: 0,
        follower_count: 0,
        status_total: 0,
        status_count: 0,
        favourite_total: 0,
        favourite_count: 0,
        bi_total: 0,
        bi_count: 0,
        mention_total: 0,
        mention_count: 0
      };
      if(user_parent.friend && obj.uid !== user_parent.friend) {
        atom.friend_link = user_parent.friend;
      }
      if(user_parent.follower && obj.uid !== user_parent.follower) {
        atom.follower_link = user_parent.follower;
      }

      i = user_metrics.length;
      user_metrics.push(atom);
    }

    if(type === 'total') {
      for(x in val) {
        if(typeof user_metrics[i][x] !== 'undefined') user_metrics[i][x] = val[x];
      }
    } else if(type === 'count') {
      for(x in val) {
        if(typeof user_metrics[i][x] !== 'undefined') user_metrics[i][x] += val[x];
      }
    }
  }
}


function findValue(vector, key, value) {
  var i = 0;
  while(i < vector.length) {
    if(vector[i][key] === value) return i;
    else i += 1;
  }
  return -1;
}
