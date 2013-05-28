

module.exports = SinaMetrics;


var Global = {
  robot: []
};


function SinaMetrics() {
  this.robot = new Robot();
}


function Robot() {
}


(function() {

  this.sample = function() {
    return {
      id: undefined,
      name: undefined,
      pid: undefined,
      friend: undefined,
      follower: undefined,
      status: undefined
    };
  }
  
  this.add = function(sample) {
    Global.robot.push(sample);
  }
  
  this.get = function() {
    return Global.robot;
  }
  
}).call(Robot.prototype);



