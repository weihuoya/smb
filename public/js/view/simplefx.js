define(function() {
  return function(duration, tween) {
    var fxNow, timerId, interval = 13,
    now = function() {
      return ( new Date() ).getTime();
    },
    createFxNow = function() {
      setTimeout(function() { fxNow = undefined; }, 0 );
      return ( fxNow = now() );
    },
    animation = {
      startTime: fxNow || createFxNow(),
      duration: duration,
      tween: tween,
      stop: function( gotoEnd ) {
        animation.tween( 1 );
        return this;
      }
    },
    action = function() {
      var currentTime = fxNow || createFxNow(),
        remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
        // archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
        temp = remaining / animation.duration || 0,
        percent = 1 - temp;
      animation.tween( percent );
      if ( percent < 1 ) {
        return remaining;
      } else {
        return false;
      }
    },
    tick = function() {
      fxNow = now();
      if ( !action() ) {
        clearInterval( timerId );
        timerId = null;
      }
      fxNow = undefined;
    };
    
    if ( action() && !timerId ) timerId = setInterval( tick, interval );
  }
})