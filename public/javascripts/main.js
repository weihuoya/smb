(function($){
  "use strict";
  
  var simpleFx = function(duration, tween) {
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
  };
  
  var bubbleLoader = function(g) {
    var startAngle = 0.0, 
        endAngle = 2 * Math.PI, 
        outerRadius = 10.0, 
        innerRadius = 5.0, 
        padding = 3.0,
        backtube, loader;
    
    g.append('circle').attr('r', function(d) {
      outerRadius = d.r - 2;
      innerRadius = d.r * 0.6666;
      return outerRadius;
    }).attr('fill', 'url(#outergrad)').style('stroke', '#b2d5ed');
    
    g.append('circle').attr('r', function(d) {
      return innerRadius;
    }).attr('fill', 'url(#innergrad)').style('stroke', '#b5d8f0');
    
    backtube = d3.svg.arc().startAngle(startAngle).endAngle(endAngle).innerRadius(function() {
      return (innerRadius+padding);
    }).outerRadius(function() {
      return (outerRadius-padding);
    });
    g.append('path').attr('d', backtube).attr('fill', 'url(#tubegrad)').style('stroke', '#bcd4e5');
    
    var loader = g.append('path').attr('class', 'loadtube').attr('fill', 'url(#loadgrad)');
    simpleFx(1500, function(percent) {
      var loadtube = d3.svg.arc().startAngle(startAngle).endAngle(endAngle*percent).innerRadius(function() {
        return (innerRadius+padding);
      }).outerRadius(function() {
        return (outerRadius-padding);
      });
      loader.attr('d', loadtube);
    });
  };

  var BaseView = Backbone.View;

  var CollectionListView = BaseView.extend({
    tagName: 'table',
    attributes: { 'cellspacing': '0' },
    initialize: function() { this.render() },
    render: function() {
      this.$el.html( $('#t-collection-header').html() );
      _(this.collection).each(function(model) { this.$el.append(this.template(model)) }, this);
      return this;
    }
  });
  
  var DatabaseListView = BaseView.extend({
    tagName: 'ul',
    attributes: { 'class': 'nav nav-list' },
    initialize: function() { this.render(); },
    render: function() {
      this.$el.html('<li class="nav-header">MongoDB</li>');
      
      _(this.collection).each(function(model) {
        //每次绘制都会修改 model ，所以只绘制一次才不会有错
        model.sizeOnDisk >>= 20;
        this.$el.append(this.template(model));
      }, this);
      
      return this;
    }
  });
  
  var CrawlerMetricsView = BaseView.extend({
    initialize: function() { this.render() },
    
    render: function() {
      var canvas = {width: 500, height: 500};
      var cx = canvas.width >> 3 - 1;
      var cy = canvas.height >> 3 - 1;
      var innerRadius = cx * 0.6666;
      var outerRadius = cx - 2;
      var startAngle = 0;
      var endAngle = 2 * Math.PI;

      var svg = d3.select(this.el).append('svg').attr('width', 900).attr('height', 500);
      var defs = svg.append('defs');

      var outergrad = defs.append('linearGradient').attr('id', 'outergrad')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      outergrad.append('stop').attr('offset', '0%').attr('stop-color', '#d6eeff');
      outergrad.append('stop').attr('offset', '100%').attr('stop-color', '#b6d8f0');

      var innergrad = defs.append('linearGradient').attr('id', 'innergrad')
      .attr('x1', '0%').attr('y1', '30%').attr('x2', '0%').attr('y2', '100%');
      innergrad.append('stop').attr('offset', '0%').attr('stop-color', '#f9fcfe');
      innergrad.append('stop').attr('offset', '100%').attr('stop-color', '#d9ebf7');

      var tubegrad = defs.append('linearGradient').attr('id', 'tubegrad')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      tubegrad.append('stop').attr('offset', '0%').attr('stop-color', '#c1dff4');
      tubegrad.append('stop').attr('offset', '100%').attr('stop-color', '#aacee6');

      var loadgrad = defs.append('linearGradient').attr('id', 'loadgrad')
      .attr('x1', '50%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      loadgrad.append('stop').attr('offset', '0%').attr('stop-color', 'yellow');
      loadgrad.append('stop').attr('offset', '100%').attr('stop-color', 'red');
    }
  });

  var StatusMetricsView = BaseView.extend({
    initialize: function() { this.render() },

    classes: function(data) {
      var i;
      var root = [];
      for(i = 0; i < data.length; ++i) {
        root.push({data: data[i], value: 35});
      }
      return {data: {sid: undefined}, children: root};
    },

    render: function() {
      var svg = d3.select(this.el).append('svg').attr('width', 900).attr('height', 500)
      .append('g');

      var bubble = d3.layout.pack().size([800, 500]).padding(1.5);
      var nodes = bubble.nodes(this.classes(this.collection));

      var node = svg.selectAll('.bubble').data(nodes).enter()
      .append('g')
      .attr('class', 'bubble').attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
      });
      bubbleLoader(node);
    }
  });

  var UserMetricsView = BaseView.extend({
    initialize: function() { this.render() },

    tree: function (data) {
      var c, v;
      var i = 0, uid = -1, queue = [];
      var root = {data: {uid: 0xFFFFFF}, children: []};
      var node = root;

      while(i < this.collection.length) {
        v = this.collection[i];

        if(v.friend_link === v.follower_link) {
          c = {data: v, children: []};
          root.children.push(c);
          queue.push(c);
          i += 1;
        } else if(v.friend_link === uid || v.follower_link === uid) {
          c = {data: v, children: []};
          node.children.push(c);
          queue.push(c);
          i += 1;
        } else if(queue.length > 0) {
          node = queue.shift();
          uid = node.data.uid;
        } else {
          break;
        }
      }

      return root;
    },

    render: function() {
      var layout = d3.select(this.el).append('svg').attr('width', 900).attr('height', 500)
      .append('g').attr('transform', 'translate(85, 0)');

      var tree = d3.layout.tree().size([500, 700]).children(function(d) {
        return (!d.children || d.children.length === 0) ? null : d.children;
      });
      
      var nodes = tree.nodes( this.tree(this.collection) );
      var links = tree.links(nodes);
      var link = d3.svg.diagonal().projection(function(d) {return [d.y, d.x]});

      layout.selectAll('.link').data(links).enter()
      .append('path').attr('class', 'link').attr('d', link).style('fill', 'none').style('stroke', 'gray');

      var group = layout.selectAll('.node').data(nodes).enter().append('g')
      .attr('class', 'node').attr('transform', function(d) {
        return 'translate(' + d.y + ',' + d.x + ')';
      });

      group.append('circle').attr('class', 'point').attr('r', 10)
      .style('fill', 'lightsalmon').style('stroke', 'red').style('stroke-width', '1px');

      group.append('text').attr('text-anchor', function(d) {
        return d.children.length ? 'end' : 'start';
      }).attr('dx', function(d) {
        return d.children.length ? -15 : 15;
      }).attr('dy', function(d) {
        return d.children.length ? -1 : 3;
      }).text(function(d) {
        return d.data.uid;
      });

    }
  });
  
  var MetricsListView = BaseView.extend({
    tagName: 'ul',
    attributes: { 'class': 'nav nav-list' },
    initialize: function() { this.render() },
    
    render: function() {
      this.$el.html( $('#t-metrics-list').html() );
      return this;
    }
  });
  
  var WeiboListView = BaseView.extend({
    tagName: 'ul',
    attributes: { 'class': 'nav nav-list' },
    initialize: function() { this.render() },
    
    render: function() {
      this.$el.html( $('#t-weibo-list').html() );
      return this;
    }
  });
  
  var StatusView = BaseView.extend({
    cache: {},
    events: { 'click #status-list a' : 'stats' },
    initialize: function() { this.render() },
    
    render: function() {
      this.setElement( $('#t-status-view').html() );
      
      if(!this.metricsListView) this.metricsListView = new MetricsListView();
      
      if(!this.databaseListView) {
        var self = this;
        $.getJSON('/status/database', function(data) { self.show('database', null, data); });
      } else {
        this.show('database');
        //this.databaseListView.delegateEvents();
      }
      
      if(!this.WeiboListView) this.weiboListView = new WeiboListView();
      
      return this;
    },
    
    show: function(type, name, value) {
      if(type === 'database') {
        if(!name) {
          if(!this.databaseListView) this.databaseListView = new DatabaseListView({collection: value});
          $('#status-list').append(this.databaseListView.$el);
          $('#status-list').append(this.metricsListView.$el);
          $('#status-list').append(this.weiboListView.$el);
        } else {
          if(!this.collectionListView) this.collectionListView = new CollectionListView();
          this.collectionListView.collection = value;
          //this.collectionListView.$el.empty();
          $('#status-content').html( this.collectionListView.render().$el );
        }
      } else if(type === 'robot') {
        if(name === 'user') {
          if(!this.userMetricsView) this.userMetricsView = new UserMetricsView({collection: value});
          $('#status-content').html( this.userMetricsView.el );
        } else if(name === 'status') {
          if(!this.statusMetricsView) this.statusMetricsView = new StatusMetricsView({collection: value});
          $('#status-content').html( this.statusMetricsView.el );
        }
        //console.log(type+'/'+name+':', value);
      } else if(type === 'crawler') {
        if(!this.crawlerMetricsView) this.crawlerMetricsView = new CrawlerMetricsView({collection: value});
        $('#status-content').html( this.crawlerMetricsView.el );
        console.log(type+'/'+name+':', value);
      } else if(type === 'weibo') {
        console.log('show: '+name);
      }
    },
    
    stats: function(e) {
      //var name = $(e.currentTarget).attr('id');
      //name = name.substr(name.lastIndexOf('/')+1);
      var type = $(e.currentTarget).data('type');
      var name = $(e.currentTarget).data('name');
      var key = type + (name ? '|'+name : '');
      
      if(!this.cache[key]) {
        var self = this;
        $.getJSON('/status/'+type+'/'+name, function(data) {
          self.show(type, name, data);
          self.cache[key] = data;
        });
      } else {
        this.show(type, name, this.cache[key]);
      }
    }
  });
  
  var SearchView = BaseView.extend({
    model: {input: ''},
    tagName: 'div',
    attributes: {'class': 'search-box'},
    events: {
      'submit form': 'submit',
      'click button.clear': 'clear',
      'input input': 'input'
    },
    
    initialize: function() {
      this.render()
    },
    
    render: function() {
      this.$el.html(this.template())
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
      this.model.input = input;
      if(input.length > 0) {
        this.$el.trigger('search', input);
        node.blur();
      }
      return false;
    },
    
    clear: function(e) {
      this.show('');
      this.$el.trigger('search');
    },
    
    input: function() {
      var button = this.$('button.clear'), input = this.$('input').val();
      return input.length > 0 ? button.show() : button.hide();
    }
  });
  
  var PagingView = Backbone.View.extend({
    model: {index: 0, total: 0},
    tagName: 'div',
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
      
      //this.$el.trigger('page', index);
    },
    
    turn: function(e) {
      var action = $(e.currentTarget).data('action');
      var index = this.model.index;
      var total = this.model.total;
      if(action === '-' && index > 1) {
        index -= 1;
        this.show(index);
        this.$el.trigger('page', index);
      } else if(action === '+' && index < total) {
        index += 1;
        this.show(index);
        this.$el.trigger('page', index);
      } else if(action === '=') {
        this.jump();
      }
    },
    
    jump: function() {
      var self = this, node = this.$('li.active'), page, form, input;
      var index = this.model.index, total = this.model.total;
      
      page = node.find('a').hide();
      form = node.find('form').show().submit(function(e) {
        var x = parseInt( input.val() );
        if(!isNaN(x) && x <= total && x > 0 && x !== index) {
          self.show(x);
          self.$el.trigger('page', x);
        }
        return input.blur(), false;
      })
      input = form.find('input').val(index).focus().blur(function(e) {
        return form.hide(), page.show()
      });
    }
  });
  
  var UserListView = BaseView.extend({
    tagName: 'div',
    attributes: { 'class': 'user-list' },
    events: {'click .user-item'   : 'select'},
    initialize: function() {},
    show: function(users) {
      this.$el.children().detach();
      _(users).each(function(user) { this.$el.append(this.template(user)) }, this)
    },
    select: function(e) {
      var user = $(e.currentTarget).data('user');
      if(user) this.$el.trigger('user', user);
    }
  });
  
  var CalendarView = BaseView.extend({
    cx: 0, cy: 0,
    tagName: 'div',
    attributes: { 'class': 'contrib-calendar' },
    initialize: function() {
      this.$el.css({position: 'relative'});
      this.show([]);
    },
    show: function(data) {
      this.$el.children().detach();
      this.calendar(data);
    },
    move: function(x) {
      if(this.cx < 20 || x < 0) {
        this.cx += x;
        d3.select('svg#calendar-graph g').attr('transform', 'translate('+this.cx+', '+this.cy+')');
      }
    },
    
    calendar: function(data) {
      var i, d, x, y, z, F, ext, sum, max = 0, mean = 0, delta, levels, counters = [], 
      k = 3.77972616981, day = 1000 * 60 * 60 * 24, colors = ["#d6e685", "#8cc665", "#44a340", "#1e6823"];
      
      data || (data = []), i = data.length;
      if(i > 0) data[i-1][0] = new Date( data[i-1][0] ), data[0][0] = new Date(data[0][0]), max = data[0][1], mean = max, counters.push(max);
      
      while(--i > 0) {
        x = data[i][0], z = data[i][1], mean += z, counters.push(z);
        y = data[i-1][0], y = data[i-1][0] = new Date(y), d = (x.getTime() - y.getTime()) / day, d = parseInt(d, 10);
        while(--d > 0) data.push([new Date(y.getTime() + d * day), 0]);
        if(z > max) max = z;
      }
      
      mean /= data.length, i = data.length, sum = 0, data.sort( function (x, y) { return d3.ascending(x[0], y[0]) } );

      while(--i >= 0) x = data[i][0], y = data[i][1], delta = y - mean, sum += delta * delta;
      d = Math.sqrt( sum / (data.length - 1) );
      
      i = 0, ext = (max - mean < 6 || max < 15) ? 1 : 3;
      while (i < ext) F = counters.filter(function (x) { var b; return b = Math.abs((mean - x) / d), b > k } ), F.length > 0 ? (F = F[0], counters = counters.filter(function (x) { return x !== F }), i === 0) : F = null, i += 1;
      
      levels = d3.scale.quantile().domain([0, d3.max(counters)]).range(colors);
      
      this.draw(data, levels);
    },
    
    draw: function(data, levels) {
      var G, W, D, tip, formater, ext, prv, wdata = {}, mdata = {}, cell = 12, padding = 2, offsetX = 20, offsetY = 20;
      this.cx = offsetX, this.cy = offsetY;
      
      tip = this.$el.append('<div class="svg-tip"></div>').find("div.svg-tip").hide();
      //tip = d3.select(this.el).append("div").attr("class", "svg-tip").style("display", "none"),
      G = d3.select(this.el).append("svg").attr("id", "calendar-graph")
      .append("g").attr("transform", "translate(" + offsetX + ", " + offsetY + ")");

      //按年份和周数划分数据
      formater = d3.time.format("%Y%U"); //[1970-9999], [0, 53]
      data.forEach(function (x) { var b; return b = formater(x[0]), wdata[b] || (wdata[b] = []), wdata[b].push(x) });
      wdata = d3.entries(wdata);
      
      ext = data.length > 0 ? data[0][0].getFullYear() : 0;
      W = G.selectAll("g.week").data(wdata).enter().append("g")
      .attr("transform", function (d, i) {
        var x = d.value[0][0];
        x = ext - x.getFullYear();
        //return x.getFullYear() === (new Date).getFullYear() && x.getDay() !== 0 && ext === 0 && (ext = -1), "translate(" + (i + ext) * cell + ", 0)"
        return "translate(" + (i + x) * cell + ", 0)"
      });
      
      formater = d3.time.format("%w"), //weekday, [0, 6]
      D = W.selectAll("rect.day").data(function (d) { return d.value } ).enter()
      .append("rect").attr("class", "day").attr("width", cell - padding).attr("height", cell - padding)
      .attr("y", function (d) { return formater(d[0]) * cell } )
      .style("fill", function (d) { return d[1] === 0 ? "#eee" : levels(d[1]) } )
      .on("click", function (d) { console.log('contributions:range:click') } );
      //.on("mouseover", function (d, y, x) {
      //  var a = d3.time.format("%Y-%m-%d"), a = a(d[0]), b = d[1], b = b === 0 ? "No Status" : b + (b > 1 ? " Statuses" : "Status"), c, w = 0, h = 0;
      //  tip.html('<strong>'+b+'</strong> on '+a);
      //  w = tip.outerWidth(), h = tip.outerHeight(), 
      //  c = {top: ( (y+1) * cell - h - 4) + "px", left: ( (x+2) * cell - w / 2) + "px"};
        //console.log(c, w, h, x, y);
        //console.log(d3.mouse(W));
      //  tip.html('<strong>'+b+'</strong> on '+a).css(c).show()
      //}).on("mouseout", function (d) { 
      //  tip.hide()
      //});

      D.append("title").text(function (d) {
        var a = d3.time.format("%Y-%m-%d"), a = a(d[0]), b = d[1], b = b === 0 ? "No Status" : b + (b > 1 ? " Statuses" : "Status");
        return b + " on " + a
      });
      
      //按年份和月份划分数据
      ext = 0;
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
      //from = this.$el.attr("data-from"), from && (from = new Date(from));
      //to = this.$el.attr("data-to"), to && (to = new Date(to));
      //D = G.selectAll("rect.day").classed("active", !1);
      //(from || to) ? (d.addClass("days-selected"), D.filter(function (d) { return from && to ? d[0] >= from && d[0] <= to : d[0] === from }).classed("active", !0)) : d.removeClass("days-selected");
      
      //.svg-tip{padding:10px;background:#222;color:#bbb;font-size:12px;width:140px;position:absolute;z-index:99999;text-align:center;border-radius:2px;box-shadow:2px 2px 2px rgba(0,0,0,0.2);display:none}.svg-tip strong{color:#ddd}.svg-tip.is-visible{display:block}.svg-tip:after{box-sizing:border-box;display:inline;font-size:12px;width:100%;line-height:1;color:rgba(0,0,0,0.8);content:"\25BC";position:absolute;text-align:center;-webkit-font-smoothing:antialiased}.svg-tip.n:after{text-shadow:2px 2px 2px rgba(0,0,0,0.2);margin:-2px 0 0 0;top:100%;left:0}
      
      //n = d3.select(document.body).append("div").attr("class", "svg-tip"),
      //m = function (a, b) {
      //      var c, d, e, f, g, h;
      //      return n.classed("is-visible", !0), n.html("<strong>" + a.commits + "</strong> " + $.pluralize(a.commits, "commit") + " by <strong>" + a.login + "</strong>"), d = $(n.node()), c = d3.event.target, f = c.ownerSVGElement, e = l(c, f), g = d.outerHeight(), h = d.outerWidth(), n.transition().duration(200).style("opacity", .9), n.style("left", "" + (e.x - h / 2) + "px").style("top", "" + (e.y - g - 5) + "px")
      //  }, f = function (a, b) {
      //      return n.transition().duration(500).style("opacity", 0), n.classed("is-visible", !1)
      //  }
      //on("mouseover", m).on("mouseout", f)
    }
  });
  
  var UserStateView = BaseView.extend({
    tagName: 'div',
    events: { 'click #calendar-ctrl a': 'scroll' },
    initialize: function() { this.render() },
    render: function() {
      if(!this.calendarView) this.calendarView = new CalendarView();
      this.$el.html( this.template() );
      this.$('div.contrib-header').after(this.calendarView.$el)
    },
    show: function(data) { this.calendarView.show(data) },
    scroll: function(e) {
      var self = this, ctrl = $(e.currentTarget).data('ctrl');
      if(ctrl === '-') {
        simpleFx(1000, function(percent) { self.calendarView.move(+10 * (1-percent)) });
        //this.calendarView.move(20);
      } else if(ctrl === '+') {
        simpleFx(1000, function(percent) { self.calendarView.move(-10 * (1-percent)) });
        //this.calendarView.move(-20);
      }
    }
  });
  
  var UserView = BaseView.extend({
    cache: {},
    tagName: 'div',
    events: {
      'search': 'search',
      'user'  : 'user',
      'page'  : 'page'
    },
    attributes: { 'class': 'row-fluid' },
    initialize: function() { this.render() },
    
    render: function() {
      var node;
      if(!this.searchView) this.searchView = new SearchView();
      if(!this.userListView) this.userListView = new UserListView();
      if(!this.pagingView) this.pagingView = new PagingView();
      if(!this.userStateView) this.userStateView = new UserStateView();
      
      this.$el.append('<div class="span3 well sidebar-nav"></div><div class="span9"></div>');
      node = this.$('div');
      node.eq(0).append(this.searchView.$el).append(this.userListView.$el).append(this.pagingView.$el);
      node.eq(1).append(this.userStateView.$el);
      this.show();
    },
    
    show: function(index, name) {
      var key, 
      self = this, 
      index = index ? index-1 : 0;
      
      if(typeof name === 'string' && name.length > 0) {
        if(name.length > 64) name = name.substr(0, 64);
        key = '/user/query/'+name+'/'+index;
      } else {
        key = '/user/'+index;
      }
      
      if(!self.cache[key]) {
        $.getJSON(key, function(data) {
          var count = Math.ceil(data.total / data.limit);
          self.userListView.show(data.users);
          self.pagingView.show(data.index+1, count);
          self.cache[key] = data;
        });
      } else {
        var data = self.cache[key];
        var count = Math.ceil(data.total / data.limit);
        self.userListView.show(data.users);
        self.pagingView.show(data.index+1, count);
      }
    },

    search: function(e, i) { this.show(0, i) },
    user: function(e, i) {
      var self = this, key = '/user/state/'+i, data = self.cache[key];
      if(!data) {
        $.getJSON(key, function(data) {
          self.userStateView.show(data);
          self.cache[key] = data;
        });
      } else {
        self.userStateView.show(data);
      }
    },
    page: function(e, i) {
      this.show(i, this.searchView.model.input)
    }
  });

  var LoginView = BaseView.extend({
    tagName: 'div',
    attributes: { 'id': 'login' },
    initialize: function() { this.render() },
    render: function() {
      //this.setElement( $('#t-user-login').html() );
      this.$el.html( $('#t-user-login').html() );
      return this;
    }
  });
  
  var SubheadView = BaseView.extend({
    initialize: function() { this.render() },
    render: function() {
      this.$el.html( this.template() );
      return this;
    }
  });
  
  var HomeView = BaseView.extend({
    initialize: function() { this.render() },
    render: function() {
      //this.$el.html( $('#t-home-view').html() );
      return this;
    }
  });
  
  var AppRouter = Backbone.Router.extend({
    routes: {
      ''       : 'home',
      'home'   : 'home',
      'status' : 'status',
      'login'  : 'login',
      'user'   : 'user',
      'robot'  : 'robot',
      'analyze': 'analyze',
      'about'  : 'about'
    },
    
    home: function() {
      if(!this.subheadView) {
        this.subheadView = new SubheadView();
        $('#subhead').append( this.subheadView.$el );
      }
      if(!this.homeView) this.homeView = new HomeView();
      
      $('#subhead').show();
      $('ul.nav')
      $('#content').children().detach();
      $('#content').append( this.homeView.$el );
    },
    
    status: function() {
      if(!this.statusView) this.statusView = new StatusView();
      $('#subhead').hide();
      $('#content').children().detach();
      $('#content').append( this.statusView.$el );
    },
    
    login: function() {
      if(!this.loginView) this.loginView = new LoginView();
      $('#subhead').hide();
      $('#content').children().detach();
      $('#content').append( this.loginView.$el );
    },
    
    user: function() {
      if(!this.userView) this.userView = new UserView();
      $('#subhead').hide();
      $('#content').children().detach();
      $('#content').append( this.userView.$el );
    },
    
    robot: function() {
      $('#subhead').hide();
      $('#content').children().detach();
    },
    
    analyze: function() {
      $('#subhead').hide();
      $('#content').children().detach();
    },
    
    about: function() {
      $('#subhead').hide();
      $('#content').children().detach();
    }
    
  });
  
  $.get('/template.html', function(data) {
    $('body').append(data);
    
    CollectionListView.prototype.template = _.template( $('#t-collection-body').html() );
    DatabaseListView.prototype.template   = _.template( $('#t-database-list').html() );
    
    PagingView.prototype.template    = _.template( $('#t-paging-view').html() );
    SearchView.prototype.template    = _.template( $('#t-search-box').html() );
    UserListView.prototype.template  = _.template( $('#t-user-item').html() );
    UserStateView.prototype.template = _.template( $('#t-user-state').html() );
	SubheadView.prototype.template      = _.template( $('#t-subhead-view').html() );
    //HomeView.prototype.template      = _.template( $('#t-home-view').html() );
    
    //CalendarView.prototype.template = _.template( $('#t-user-calendar').html() );
    //UserView.prototype.template = _.template( $('#t-user-content').html() );
    //UserView.prototype.useritem = _.template( $('#t-user-item').html() );
    
    var app = new AppRouter();
    Backbone.history.start();
  });

})(jQuery);
