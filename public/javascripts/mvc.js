var BaseView = Backbone.View;

var PagingView = Backbone.View.extend({
  model: {index: 0, total: 0},
  tagName: 'div',
  template: _.template('<ul><li><a href="javascript:void(0);" data-action="-">«</a></li><li class="active"><a href="javascript:void(0);" data-action="="></a><form><input type="text" /></form></li><li><a href="javascript:void(0);" data-action="+">»</a></li></ul>'),
  attributes: { 'class': 'pagination' },
  events: {'click a': 'turn'},
  initialize: function() { this.render() },
  
  render: function() {
    this.$el.html(this.template());
    this.show();
  },
  
  show: function(index, total) {
    var node = this.$('ul li');
    
    if(index) this.model.index = index;
    else index = this.model.index;
    
    if(total) this.model.total = total;
    else total = this.model.total;
    
    if(index > 1) node.eq(0).removeClass('disabled');
    else node.eq(0).addClass('disabled');
    
    node.eq(1).children('form').hide();
    node.eq(1).children('a').text(index+'/'+total).show();

    if(index < total) node.eq(2).removeClass('disabled');
    else node.eq(2).addClass('disabled');
    
    this.$el.trigger('page', index);
  },
  
  turn: function(e) {
    var action = $(e.currentTarget).data('action');
    var index = this.model.index;
    var total = this.model.total;
    if(action === '-' && index > 1) {
      this.show(index-1);
    } else if(action === '+' && index < total) {
      this.show(index+1);
    } else if(action === '=') {
      this.jump();
    }
  },
  
  jump: function() {
    var self = this, node = this.$('li.active'), input;
    var index = this.model.index, total = this.model.total;
    
    node.find('a').hide();
    input = node.find('form').show().submit(function(e) {
      var x = parseInt( input.val() );
      if(!isNaN(x) && x <= total && x > 0 && x !== index) self.show(x);
      return input.blur(), false;
    }).find('input').val(index).focus();
  }
});

var SearchBoxView = BaseView.extend({
  model: {input: ''},
  tagName: 'div',
  attributes: {'class': 'search-box'},
  events: {
    'submit form': 'submit',
    'click button.clear': 'clear',
    'input input': 'input'
  },
  
  template: _.template('<form><input type="text" placeholder="Search User by Name"/><button type="button" class="clear">×</button></form>'),
  
  initialize: function() {
    this.render()
  },
  
  render: function() {
    this.$el.html(this.template());
    this.show();
  },
  
  show: function(input) {
    if(typeof input === 'string') this.model.input = input;
    else input = this.model.input;
    this.$('input').val(input);
    if(input.length > 0) this.$('button.clear').show();
    else this.$('button.clear').hide();
  },
  
  submit: function() {
    var node = this.$('input'), input = node.val();
    if(input.length > 0) {
      this.$el.trigger('search', input);
      node.blur();
    }
    return false;
  },
  
  clear: function(e) {
    this.show('');
  },
  
  input: function(e) {
    var button = this.$('button.clear'), data = this.$('input').val();
    return data.length > 0 ? button.show() : button.hide();
  }
});


var AppView = BaseView.extend({
  events: {
    'page'   : 'page',
    'search' : 'search'
  },
  initialize: function() { this.render() },
  render: function() {
    if(!this.searchBoxView) this.searchBoxView = new SearchBoxView({model: {input: 'weey'}});
    if(!this.pagingView) this.pagingView = new PagingView({model: {index: 1, total: 10}});
    this.$el.append( this.searchBoxView.$el );
    this.$el.append( this.pagingView.$el );
  },
  page: function(e, i) { console.log(i) },
  search: function(e, i) { console.log(i) },
});

var app = new AppView();
$('#content').append( app.$el );











/*
  var UserStateView = BaseView.extend({
    tagName: 'div',
    attributes: { 'class': 'span9' },
    initialize: function(options) { this.render() },
    render: function() {
    }
  });
  
  var CalendarView = BaseView.extend({
    cid: 'calendar-graph', 
    ccx: 0,
    events: { 'click #calendar-ctrl span': 'translate' },
    initialize: function() { this.render() },
    
    render: function() { this.calendar(this.collection) },
    
    translate: function(e) {
    },
    
    calendar: function(data) {
      var d, k = 3.77972616981, cell = 12, padding = 2, offsetX = 20, offsetY = 20, colors = ["#d6e685", "#8cc665", "#44a340", "#1e6823"],
      max, mean, variance, counters, colors, formater, wdata, mdata, from, to, ext, levels, G, W, D;

      variance = function (data) {
        var i, mean, sum, delta, len = data.length;
        if (len < 1) return NaN;
        if (len === 1) return 0;
        mean = d3.mean(data), i = len, sum = 0;
        while (--i >= 0) delta = data[i] - mean, sum += delta * delta;
        return Math.sqrt( sum / (len - 1) );
      };
      
      this.ccx = offsetX;
      
      data || (data = []), data = data.map( function(d) { return [new Date(d[0]), d[1]] } ).sort( function (x, y) { return d3.ascending(x[0], y[0]) } );
      counters = data.map( function (x) { return x[1] } );
      d = variance(counters), mean = d3.mean(counters), max = d3.max(counters), i = 0, ext = (max - mean < 6 || max < 15) ? 1 : 3;
      while (i < ext) F = counters.filter(function (x) { var b; return b = Math.abs((mean - x) / d), b > k } ), F.length > 0 ? (F = F[0], counters = counters.filter(function (x) { return x !== F }), i === 0) : F = null, i += 1;

      G = d3.select(this.el).append("svg")
      .attr("id", this.cid).append("g").attr("transform", "translate(" + offsetX + ", " + offsetY + ")");
      
      //按年份和周数划分数据
      wdata = {};
      formater = d3.time.format("%Y%U"); //[1970-9999], [0, 53]
      data.forEach(function (x) { var b; return b = formater(x[0]), wdata[b] || (wdata[b] = []), wdata[b].push(x) });
      wdata = d3.entries(wdata);
      
      ext = 0;
      W = G.selectAll("g.week").data(wdata).enter().append("g")
      .attr("transform", function (d, i) {
        var x = d.value[0][0];
        return x.getFullYear() === (new Date).getFullYear() && x.getDay() !== 0 && ext === 0 && (ext = -1), "translate(" + (i + ext) * cell + ", 0)"
      });
      
      formater = d3.time.format("%w"); //weekday, [0, 6]
      levels = d3.scale.quantile().domain([0, max]).range(colors);
      D = W.selectAll("rect.day").data(function (d) { return d.value } ).enter()
      .append("rect").attr("class", "day").attr("width", cell - padding).attr("height", cell - padding)
      .attr("y", function (d) { return formater(d[0]) * cell } )
      .style("fill", function (d) { return d[1] === 0 ? "#eee" : levels(d[1]) } )
      .on("click", function (d) { console.log('contributions:range:click') } );

      D.append("title").text(function (d) {
        var b = d[1];
        return b === 0 ? "No" : d[1], "" + b + " contributions" + " on " + d[0]
      });
      
      //按年份和月份划分数据
      ext = 0;
      mdata = {};
      formater = d3.time.format("%m-%y"); //[01-12], [00-99]
      wdata.forEach(function (x) { var b; return b = formater(x.value[0][0]), mdata[b] || (mdata[b] = [x.value[0][0], 0]), mdata[b][1] += 1 });
      mdata = d3.entries(mdata).sort(function (x, y) { return d3.ascending(x.value[0], y.value[0]) });
      
      formater = d3.time.format("%b"); //月份缩写
      G.selectAll("text.month").data(mdata).enter().append("text")
      .attr("x", function (b) { var d; return d = cell * ext, ext += b.value[1], d })
      .attr("y", -5).attr("class", "month")
      .style("display", function (d) { if (d.value[1] <= 2) return "none" })
      .text(function (d) { return formater(d.value[0]) } );

      G.selectAll("text.day").data(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).enter()
      .append("text").style("display", function (d, i) { if (i % 2 === 0) return "none" })
      .attr("text-anchor", "middle").attr("class", "wday").attr("dx", -10)
      .attr("dy", function (d, i) { return offsetX + ((i - 1) * cell + padding) })
      .text(function (d) { return d[0] });
      
      //高亮一段日期
      from = this.$el.attr("data-from"), from && (from = new Date(from));
      to = this.$el.attr("data-to"), to && (to = new Date(to));
      D = G.selectAll("rect.day").classed("active", !1);
      (from || to) ? (d.addClass("days-selected"), D.filter(function (d) { return from && to ? d[0] >= from && d[0] <= to : d[0] === from }).classed("active", !0)) : d.removeClass("days-selected");
    }
  });
  
  var UserView = BaseView.extend({
    cache: {}, user: undefined, index: 0, limit: 0, total: 0,
    initialize: function() { this.render() },
    events: {
      'click #user-page a' : 'turn',
      'click .user-item'   : 'state'
    },
    
    render: function() {
      var self = this;
      this.$el.html( this.template() );
      this.page(this.index);
      this.$('#user-query').submit(function(e) { self.page(0, self.$('#user-query input').val()) });
      return this;
    },
    
    state: function(e) {
      var self = this, id = $(e.currentTarget).data('user');
      $.getJSON('/user/state/'+id, function(data) {
        self.$('#user-content').html( self.calendar() );
        self.graph('#graph', data);
      });
    },
    
    turn: function(e) {
      var self = this, action = $(e.currentTarget).data('action');

      if(action === '-' && self.index > 0) {
        self.index -= 1;
        self.page(self.index, self.user);
      } else if(action === '+' && (self.index+1) < self.total) {
        self.index += 1;
        self.page(self.index, self.user);
      } else if(action === '#') {
        self.jump();
      }
    },
    
    jump: function() {
      var self = this;
      self.$('#user-page li.active').children().detach();
      self.$('#user-page li.active').html('<form id="page-query"><input type="text"></form>');
      
      self.$('#user-page input').blur(function(e) {
        self.$('#user-page li.active').children().detach();
        self.$('#user-page li.active').html('<a href="#user" data-action="#">'+(self.index+1)+'/'+self.total+'</a>');
      });
      
      self.$('#page-query').submit(function(e) {
        var index = parseInt( self.$('#page-query input').val() );
        if(!isNaN(index) && index < self.total) {
          self.index = index - 1;
          self.page(self.index, self.user);
        }
        self.$('#user-page input').blur();
      });
      
      self.$('#user-page input').focus();
    },
    
    page: function(index, name) {
      var self = this, key;
      if(typeof name === 'string' && name.length > 0) {
        if(name.length > 64) name = name.substr(0, 64);
        self.user = name;
        key = '/user/query/'+name+'/'+index;
      } else {
        self.user = undefined;
        key = '/user/'+index;
      }
      if(!self.cache[key]) {
        $.getJSON(key, function(data) {
          self.show(data);
          self.cache[key] = data;
        });
      } else {
        self.show(self.cache[key], index, self.total);
      }
    },
    
    show: function(data) {
      this.total = Math.ceil(data.total / data.limit);
      this.limit = data.limit;
      this.index = data.index;
      
      this.$('#user-list').children().detach();
      
      _(data.users).each(function(user) {
        this.$('#user-list').append(this.useritem(user));
      }, this);
      
      if(this.index > 0) this.$('#user-page li').eq(0).removeClass('disabled');
      else this.$('#user-page li').eq(0).addClass('disabled');
      
      this.$('#user-page li.active a').text( (this.index+1) + '/' + this.total );
      
      if(this.index+1 < this.total) this.$('#user-page li').eq(2).removeClass('disabled');
      else this.$('#user-page li').eq(2).addClass('disabled');
    }
  });*/