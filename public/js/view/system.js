define(['backbone'], function() {
  return Backbone.View.extend({
    cache: {},
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
    template: _.template( $('#t-system-view').html() ),
    initialize: function() { this.render() },
    render: function() { 
      var self = this;
      self.data('sys', function(data) { self.sys(data) });
      self.data('cpu', function(data) { self.cpu(data) });
      return self; 
    },
    data: function(type, callback) {
      var self = this, key = '/status/'+type, data = self.cache[key];
      if(!data) {
        $.getJSON(key, function(data) {
          data.uptime = parseInt(data.uptime / 60, 10);
          data.freemem >>>= 20;
          data.totalmem >>>= 20;
          callback(data);
          self.cache[key] = data;
        });
      } else {
        callback(data);
      }
    },
    sys: function(data) {
      this.$el.append(this.template(data));
    },
    cpu: function(data) {
      var div = $('<div class="info-bar"/>');
      for(var i = 0; i < data.length; ++i) {
        div.append('<div><p>'+data[i].model+'</p></div>');
        div.append('<div class="progress"><div id="cpu-bar'+i+'" class="bar" style="width: 0%"></div></div>');
      }
      div.css('display', 'none');
      this.$el.append(div);
      div.slideDown('slow');
      for(i = 0; i < data.length; ++i) {
        div.find('#cpu-bar'+i).animate({width: (100 - data[i].idle / data[i].total * 100)+'%'});
      }
    }
  })
})