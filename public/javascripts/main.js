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
      this.$('tr td[rowspan]').filter(':even').each(function() {
        $(this).parent().css('background-color', '#f8f8f8').nextAll().slice(0, this.rowSpan-1).css('background-color', '#f8f8f8');
      });
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
    elems: undefined,
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
    events: { 'click .nav-list a' : 'stats' },
    initialize: function() {
      //this.metricsListView = new MetricsListView();
      //this.weiboListView = new WeiboListView();
      this.render();
    },
    
    render: function() {
      this.elems = $('<div class="span3 well sidebar-nav"/><div class="span9"/>');
      this.$el.html(this.elems);
      if(!this.databaseListView) {
        var self = this;
        $.getJSON('/status/database', function(data) { self.show('database', null, data); });
      } else {
        this.show('database');
      }
      return this;
    },
    
    show: function(type, name, value) {
      if(type === 'database') {
        if(!name) {
          if(!this.databaseListView) this.databaseListView = new DatabaseListView({collection: value});
          this.elems.eq(0).append(this.databaseListView.$el);
          //this.elems.eq(0).append(this.metricsListView.$el);
          //this.elems.eq(0).append(this.weiboListView.$el);
        } else {
          if(!this.collectionListView) this.collectionListView = new CollectionListView();
          this.collectionListView.collection = value;
          this.elems.eq(1).html( this.collectionListView.render().$el );
        }
      } /*else if(type === 'robot') {
        if(name === 'user') {
          if(!this.userMetricsView) this.userMetricsView = new UserMetricsView({collection: value});
          this.elems.eq(1).html( this.userMetricsView.$el );
        } else if(name === 'status') {
          if(!this.statusMetricsView) this.statusMetricsView = new StatusMetricsView({collection: value});
          this.elems.eq(1).html( this.statusMetricsView.$el );
        }
      } else if(type === 'crawler') {
        if(!this.crawlerMetricsView) this.crawlerMetricsView = new CrawlerMetricsView({collection: value});
        this.elems.eq(1).html( this.crawlerMetricsView.$el );
        console.log(type+'/'+name+':', value);
      } else if(type === 'weibo') {
        console.log('show: '+name);
      }*/
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
    initialize: function() { this.render() },
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

  var PagingView = BaseView.extend({
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
      var index = this.model.index, total = this.model.total, action = $(e.currentTarget).data('action');
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
      var self = this, index = this.model.index, total = this.model.total, 
      node = this.$('li.active'), page, form, input;
      
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
  
  var CalenderGridView = BaseView.extend({
    tagName: 'div',
    attributes: { 'class': 'contrib-details grid' },
    initialize: function() { this.show(); },
    show: function(model) {
      if(!model) model = {max: 0, max_text: '', act: 0, act_text: '', mean: 0, mean_text: ''};
      this.$el.html( this.template(model) );
      return this;
    }
  });
  
  var CalendarView = BaseView.extend({
    cx: 0, cy: 0,
    tagName: 'div',
    attributes: { 'class': 'contrib-calendar' },
    initialize: function() {
      this.$el.css({position: 'relative'});
      this.CalenderGridView = new CalenderGridView();
      this.show();
    },
    show: function(data) {
      this.$el.children().detach();
      return this.calendar(data);
    },
    move: function(x) {
      if(this.cx < 20 || x < 0) {
        this.cx += x;
        d3.select('svg#calendar-graph g').attr('transform', 'translate('+this.cx+', '+this.cy+')');
      }
    },
    
    calendar: function(data) {
      var i, d, x, y, z, F, week, ext, sum, mdate, ib, ie, dc, begin, end, acount, dcount, is = 0, streak = 0, max = 0, mean = 0, delta, levels, counters = [], 
      k = 3.77972616981, day = 1000 * 60 * 60 * 24, colors = ["#d6e685", "#8cc665", "#44a340", "#1e6823"];
      data || (data = []), acount = i = data.length;
      
      if(i > 0) {
        ib = ie = mdate = begin = end = data[i-1][0] = new Date( data[i-1][0] );
        is = streak = mean = max = data[i-1][1], dc = dcount = 0;
        counters.push(max);
        
        //计算平均值，获取最长活动时间，补上没有数据的日期信息
        while(--i > 0) {
          ib = x = data[i][0], z = data[i][1], mean += z, counters.push(z);
          y = data[i-1][0], y = data[i-1][0] = new Date(y), d = (x.getTime() - y.getTime()) / day, d = parseInt(d, 10);
          
          if(d < 2) {
            dc += 1, is += z;
          } else {
            if(dc > dcount || (dc === dcount && streak < is) ) streak = is, dcount = dc, begin = ib, end = ie;
            dc = 1, ie = x, is = z;
          }
          
          while(--d > 0) data.push([new Date(y.getTime() + d * day), 0]);
          if(z > max) mdate = x, max = z;
        }
        
        i = data.length, mean /= i, sum = 0, week = data[0][0].getDay(), data.sort( function (x, y) { return d3.ascending(x[0], y[0]) } );
        while(week > 0) week -= 1, data.unshift([new Date(data[0][0].getTime() - day), 0]);
        
        //计算标准差
        while(--i >= 0) x = data[i][0], y = data[i][1], delta = y - mean, sum += delta * delta;
        d = Math.sqrt( sum / (data.length - 1) );
        
        //计算颜色分级
        i = 0, ext = (max - mean < 6 || max < 15) ? 1 : 3;
        while (i < ext) F = counters.filter(function (x) { var b; return b = Math.abs((mean - x) / d), b > k } ), F.length > 0 ? (F = F[0], counters = counters.filter(function (x) { return x !== F }), i === 0) : F = null, i += 1;
      }
      
      levels = d3.scale.quantile().domain([0, d3.max(counters)]).range(colors);
      this.draw(data, levels);
      return {max: {value: max, date: mdate}, act: {value: dcount, begin: begin, end: end, total: acount}, mean: {value: mean}};
    },
    
    draw: function(data, levels) {
      var G, W, D, tip, formater, ext, prv, epoch, self = this, wdata = {}, mdata = {}, cell = 12, padding = 2, offsetX = 20, offsetY = 20;
      this.cx = offsetX, this.cy = offsetY, tip = $('<div class="svg-tip" />').hide(), this.$el.append(tip);
      
      G = d3.select(this.el).append("svg").attr("id", "calendar-graph")
      .append("g").attr("transform", "translate(" + offsetX + ", " + offsetY + ")");

      //按年份和周数划分数据
      formater = d3.time.format("%Y%U"); //[1970-9999], [0, 53]
      data.forEach(function (x) { var b; return b = formater(x[0]), wdata[b] || (wdata[b] = []), wdata[b].push(x) });
      wdata = d3.entries(wdata);
      
      epoch = data.length > 0 ? data[0][0].getFullYear() : 0;
      W = G.selectAll("g.week").data(wdata).enter().append("g")
      .attr("transform", function (d, i) {
        var x = d.value[0][0];
        x = epoch - x.getFullYear();
        return "translate(" + (i + x) * cell + ", 0)"
      });
      
      formater = d3.time.format("%w"), //weekday, [0, 6]
      D = W.selectAll("rect.day").data(function (d) { return d.value } ).enter()
      .append("rect").attr("class", "day").attr("width", cell - padding).attr("height", cell - padding)
      .attr("y", function (d) { return formater(d[0]) * cell } )
      .style("fill", function (d) { return d[1] === 0 ? "#eee" : levels(d[1]) } )
      .on("click", function (d) { console.log('contributions:range:click') } )
      .on("mouseover", function(data, row, col) { //data 节点数据, row 行, col 列
        var width, height, pos, time=d3.time.format("%Y-%m-%d")(data[0]), text=data[1]===0?"No Status":data[1]+(data[1]>1?" Statuses":"Status");
        tip.html("<strong>"+text+"</strong> on "+time), width = tip.outerWidth(), height = tip.outerHeight();
        row+=1, col+=2-(data[0].getFullYear()-epoch), pos={top: (row*cell-height-4)+"px", left: (col*cell-width/2+1+self.cx-offsetX)+"px"};
        tip.css(pos).show();
      }).on("mouseout", function() { tip.hide() });

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
    }
  });
  
  var UserStateView = BaseView.extend({
    tagName: 'div',
    attributes: { 'class': 'capped-box' },
    events: { 'click #calendar-ctrl a': 'scroll' },
    initialize: function() {
      this.calendarView = new CalendarView();
      this.calenderGridView = new CalenderGridView();
      this.render();
    },
    render: function() {
      this.$el.html( this.template() );
      this.$('div.contrib-header').after(this.calendarView.$el);
      this.$el.append(this.calenderGridView.$el);
    },
    show: function(data) {
      var format = d3.time.format("%Y-%m-%d"), stats = this.calendarView.show(data);
      this.calenderGridView.show({
        max: stats.max.value,
        max_text: 'Date: '+format(stats.max.date),
        act: stats.act.value,
        act_text: format(stats.act.begin)+' To '+format(stats.act.end),
        mean: stats.mean.value.toFixed(2),
        mean_text: 'Actived ' + stats.act.total + (stats.act.total>1?' days':' day')
      });
    },
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
    attributes: { 'class': 'row-fluid' },
    events: {
      'search': 'search',
      'user'  : 'user',
      'page'  : 'page'
    },
    initialize: function() {
      this.searchView = new SearchView();
      this.userListView = new UserListView();
      this.pagingView = new PagingView();
      this.userStateView = new UserStateView();
      this.render();
    },
    
    render: function() {
      var node = $('<div class="span3 well sidebar-nav"/><div class="span9"/>');
      this.$el.html( node );
      node.eq(0).append(this.searchView.$el).append(this.userListView.$el).append(this.pagingView.$el);
      node.eq(1).append(this.userStateView.$el);
      this.show();
    },
    
    show: function(index, name) {
      var key, data, self = this;
      index = index ? index-1 : 0;
      if(typeof name === 'string' && name.length > 0) {
        if(name.length > 64) name = name.substr(0, 64);
        key = '/data/user/'+name+'/'+index;
      } else {
        key = '/data/user/'+index;
      }
      data = self.cache[key];
      
      if(!data) {
        $.getJSON(key, function(data) {
          var count = Math.ceil(data.total / data.limit);
          self.userListView.show(data.users);
          self.pagingView.show(data.index+1, count);
          self.cache[key] = data;
        });
      } else {
        var count = Math.ceil(data.total / data.limit);
        self.userListView.show(data.users);
        self.pagingView.show(data.index+1, count);
      }
    },

    search: function(e, i) { this.show(0, i) },
    user: function(e, i) {
      var self = this, key = '/data/state/'+i, data = self.cache[key];
      location.hash = '#user/state/'+i;
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
    attributes: { 'id': 'login', 'class': 'row-fluid' },
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
  
  var SystemView = BaseView.extend({
    cache: {},
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
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
  });
  
  var ClusterListView = BaseView.extend({
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
    initialize: function() { },
    show: function(clusters) {
      this.$el.children().detach();
      _(clusters).each(function(cluster) { this.$el.append(this.template(cluster)) }, this)
    }
  });
  
  var AnalyzeHeroView = BaseView.extend({
    model: { cluster: {index: 0, total: 0}, page: {index: 0, total: 0}},
    tagName: 'div',
    attributes: { 'class': 'navbar' },
    events: { 'click a': 'turn'},
    initialize: function() { this.render() },
    render: function() {
      this.$el.html( this.template() );
      this.show();
    },
    show: function(model) {
      var cluster, page, node = this.$('ul li');
      if(model) cluster = model.cluster, page = model.page;
      
      if(cluster) this.model.cluster = cluster;
      else cluster = this.model.cluster;
      
      if(page) this.model.page = page;
      else page = this.model.page;
      
      if(cluster.index > 1) node.eq(1).removeClass('disabled');
      else node.eq(1).addClass('disabled');
      
      if(cluster.index < cluster.total) node.eq(3).remove('disabled');
      else node.eq(3).addClass('disabled');
      
      node.eq(2).children('form').hide();
      node.eq(2).children('a').text(cluster.index+'/'+cluster.total).css('display', 'block');
      
      if(page.index > 1) node.eq(5).removeClass('disabled');
      else node.eq(5).addClass('disabled');
      
      if(page.index < page.total) node.eq(7).remove('disabled');
      else node.eq(7).addClass('disabled');
      
      node.eq(6).children('form').hide();
      node.eq(6).children('a').text(page.index+'/'+page.total).css('display', 'block');
    },
    turn: function(e) {
      var action = $(e.currentTarget).data('action');
      
      switch(action) {
        case 'cp':
          if(this.model.cluster.index > 1) {
            this.model.cluster.index -= 1;
            this.model.page.index = 1;
            //this.show(this.model);
            this.$el.trigger('cluster', this.model);
          }
          break;
        case 'ce':
          this.jump(action);
          break;
        case 'cn':
          if(this.model.cluster.index < this.model.cluster.total) {
            this.model.cluster.index += 1;
            this.model.page.index = 1;
            //this.show(this.model);
            this.$el.trigger('cluster', this.model);
          }
        case 'pp':
          if(this.model.page.index > 1) {
            this.model.page.index -= 1;
            //this.show(this.model);
            this.$el.trigger('cluster', this.model);
          }
          break;
        case 'pe':
          this.jump(action);
          break;
        case 'pn':
          if(this.model.page.index < this.model.page.total) {
            this.model.page.index += 1;
            //this.show(this.model);
            this.$el.trigger('cluster', this.model);
          }
        default:
          break;
      }
    },
    jump: function(action) {
      var self = this, model, node = this.$('ul li'), page, form, input;
      
      if(action === 'ce') {
        this.model.page.index = 1;
        model = this.model.cluster;
        node = node.eq(2);
      } else {
        model = this.model.page;
        node = node.eq(6);
      }
      
      page = node.children('a').hide();
      form = node.children('form').show().submit(function(e) {
        var x = parseInt( input.val() );
        if(!isNaN(x) && x <= model.total && x > 0 && x !== model.index) {
          model.index = x;
          //self.show(this.model);
          self.$el.trigger('page', this.model);
        }
        return input.blur(), false;
      })
      input = form.children('input').val(model.index).focus().blur(function(e) {
        return form.hide(), page.css('display', 'block');
      });
    }
  });
  
  var DatePickView = BaseView.extend({
    tagName: 'div',
    attributes: { 'class': 'date-pick' },
    events: {'click button': 'submit'},
    initialize: function() { this.render() },
    render: function() {
      var i, now = new Date(), year = now.getFullYear(), month = now.getMonth();
      this.$el.html($('#t-datepick-view').html());
      this.$('#datepicker-start').datetimepicker({pickTime: false});
      this.$('#datepicker-end').datetimepicker({pickTime: false});
    },
    submit: function(e) {
      var self = this, start = this.$('#datepicker-start input').val(), end = this.$('#datepicker-end input').val();
      if(!start || !end || start === end) {
        self.$el.trigger('alert', {text: '请输入一个时间段，系统才能分析这个时间段内的微博数据！', type: 'warning'} );
      } else {
        $.getJSON('/analyze/cluster/'+start+'/'+end, function(data) {
          self.$el.trigger('alert', {text: '分析请求已经提交给系统处理，请稍后刷新页面查看结果！', type: 'info'});
        });
      }
    }
  });
  
  var RecordListView = BaseView.extend({
    model: {id: 0},
    tagName: 'ul',
    attributes: { 'class': 'nav nav-list' },
    events: {'click li a': 'select'},
    initialize: function() { },
    show: function(records) {
      this.$el.children().detach();
      this.$el.html('<li class="nav-header">已分析的时间段</li>');
      _(records).each(function(record) {
        var text = record.date_start + ' 到 ' + record.date_end;
        this.$el.append(this.template({id: record.id, k: record.k, record: text}));
      }, this);
    },
    select: function(e) {
      var id = $(e.currentTarget).data('name');
      if(id) this.model.id = parseInt(id, 10), this.$el.trigger('record', this.model.id);
    }
  });
  
  var AlertView = BaseView.extend({
    timeId: null,
    tagName: 'div',
    initialize: function() {
      this.$el.hide();
    },
    show: function(obj) {
      var text = obj.text, type = obj.type, self = this;
      switch(type) {
        case 'warning':
          this.$el.removeClass().addClass('alert alert-block');
          break;
        case 'error':
          this.$el.removeClass().addClass('alert alert-error');
          break;
        case 'success':
          this.$el.removeClass().addClass('alert alert-success');
          break;
        case 'info':
          this.$el.removeClass().addClass('alert alert-info');
          break;
      }
      this.$el.html(text).show('slow');
      if(this.timeId) clearTimeout(this.timeId);
      this.timeId = setTimeout(function() {
        self.$el.hide('slow'), self.timeId = null;
      }, 2000);
    }
  });
  
  var AnalyzeView = BaseView.extend({
    cache: {},
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
    events: {
      'record' : 'record',
      'cluster': 'cluster',
      'alert': 'message'
    },
    initialize: function() {
      this.datePickView = new DatePickView();
      this.recordListView = new RecordListView();
      this.pagingView = new PagingView();
      
      this.alertView = new AlertView();
      this.analyzeHeroView = new AnalyzeHeroView();
      this.clusterListView = new ClusterListView();
      this.render();
    },
    render: function() {
      var node = $('<div class="span3 well sidebar-nav"/><div class="span9"/>');
      this.$el.html( node );
      node.eq(0).append(this.datePickView.$el).append(this.recordListView.$el).append(this.pagingView.$el);
      node.eq(1).append(this.alertView.$el).append(this.analyzeHeroView.$el).append(this.clusterListView.$el);
      this.show();
    },
    message: function(e, i) { this.alertView.show(i) },
    show: function(index, date) {
      var key, data, self = this;
      index = index ? index-1:0, key = '/data/record/' + index, data = self.cache[key];
      
      if(!data) {
        $.getJSON(key, function(data) {
          var start, end, i = data.records.length, 
          format = d3.time.format("%Y-%m-%d"), 
          count = Math.ceil(data.total / data.limit);
          while(--i >= 0) {
            start = data.records[i].date_start, end = data.records[i].date_end;
            start = new Date(start), end = new Date(end);
            data.records[i].date_start = format(start), data.records[i].date_end = format(end);
          }
          self.recordListView.show(data.records);
          self.pagingView.show(data.index+1, count);
          self.cache[key] = data;
        });
      } else {
        var count = Math.ceil(data.total / data.limit);
        self.analyzeListView.show(data.records);
        self.pagingView.show(data.index+1, count);
      }
    },
    record: function(e, i) {
      this.status(i); 
    },
    cluster: function(e, i) {
      this.status(this.recordListView.model.id, i);
    },
    status: function(id, cdata) {
      var self = this, key, data;
      if(!cdata) {
        key = 'cluster/'+id+'/1/0', location.hash = '#'+key, key = '/data/'+key;
        cdata = { cluster: {index: 0, total: 0}, page: {index: 0, total: 0}};
      } else {
        key = 'cluster/'+id+'/'+cdata.cluster.index+'/'+(cdata.page.index-1),
        location.hash = '#'+key, key = '/data/'+key;
      }
      data = self.cache[key];
      
      if(!data) {
        $.getJSON(key, function(data) {
          var created_at, i = data.clusters.length, format = d3.time.format("%Y-%m-%d");
          while(--i >= 0) {
            if(!data.clusters[i].user) data.clusters[i].user = {id: 0, screen_name: '', friends_count: 'N', followers_count: 'N', statuses_count: 'N'};
            created_at = data.clusters[i].created_at, created_at = new Date(created_at);
            data.clusters[i].created_at = format(created_at);
          }
          if(data.count === 0) cdata.cluster.index = cdata.cluster.total = cdata.page.total = cdata.page.index = 0;
          else cdata.cluster.index = data.k, cdata.cluster.total = data.count-1, cdata.page.total = Math.ceil(data.total / data.limit), cdata.page.index = cdata.page.total === 0 ? 0 : data.index+1;
          self.analyzeHeroView.show(cdata);
          self.clusterListView.show(data.clusters);
          self.cache[key] = data;
        });
      } else {
        if(data.count === 0) cdata.cluster.index = cdata.cluster.total = cdata.page.total = cdata.page.index = 0;
        else cdata.cluster.index = data.k, cdata.cluster.total = data.count-1, cdata.page.total = Math.ceil(data.total / data.limit), cdata.page.index = cdata.page.total === 0 ? 0 : data.index+1;
        self.analyzeHeroView.show(cdata);
        self.clusterListView.show(data.clusters);
      }
    }
  });
  
  var AboutView = BaseView.extend({
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
    initialize: function() { this.render() },
    render: function() {
      this.$el.html( this.template() );
      return this;
    }
  });
  
  var FooterView = BaseView.extend({
    tagName: 'footer',
    initialize: function() { this.render() },
    render: function() {
      this.$el.html('<p>Developed by ZhangWei, 2013</p>');
      return this;
    }
  });
  
  var AppRouter = Backbone.Router.extend({
    subhead: undefined,
    content: undefined,
    routes: {
      ''       : 'home',
      'home'   : 'home',
      'status' : 'status',
      'login'  : 'login',
      'user'   : 'user',
      'robot'  : 'robot',
      'analyze': 'analyze',
      'about'  : 'about',
      'user/:act/:id'   : 'user',
      'analyze/:id/:k/:p': 'analyze'
    },
    
    initialize: function() {
      this.subhead = $('#subhead'), this.content = $('#content');
      this.footerView = new FooterView();
    },

    home: function() {
      if(!this.subheadView) {
        this.subheadView = new SubheadView();
        this.subhead.append(this.subheadView.$el);
      }
      if(!this.systemView) this.systemView = new SystemView();
      this.subhead.show();
      this.content.children().detach();
      this.content.append(this.systemView.$el).append(this.footerView.$el);
    },
    
    status: function() {
      if(!this.statusView) this.statusView = new StatusView();
      this.subhead.hide();
      this.content.children().detach();
      this.content.append(this.statusView.$el).append(this.footerView.$el);
    },
    
    login: function() {
      if(!this.loginView) this.loginView = new LoginView();
      this.subhead.hide();
      this.content.children().detach();
      this.content.append(this.loginView.$el).append(this.footerView.$el);
    },
    
    user: function(act, id) {
      if(!this.userView) this.userView = new UserView();
      this.subhead.hide();
      this.content.children().detach();
      this.content.append(this.userView.$el).append(this.footerView.$el);
    },
    
    robot: function() {
      this.subhead.hide();
      this.content.children().detach();
      this.content.append(this.footerView.$el);
    },
    
    analyze: function(id, k, page) {
      if(!this.analyzeView) this.analyzeView = new AnalyzeView();
      this.subhead.hide();
      this.content.children().detach();
      this.content.append(this.analyzeView.$el).append(this.footerView.$el);
    },
    
    about: function() {
      if(!this.aboutView) this.aboutView = new AboutView();
      this.subhead.hide();
      this.content.children().detach();
      this.content.append(this.aboutView.$el).append(this.footerView.$el);
    }
    
  });
  
  $.get('/template.html', function(data) {
    $('body').append(data);
    
    CollectionListView.prototype.template = _.template( $('#t-collection-body').html() );
    DatabaseListView.prototype.template   = _.template( $('#t-database-list').html() );
    RecordListView.prototype.template   = _.template( $('#t-record-list').html() );
    CalenderGridView.prototype.template = _.template( $('#t-calender-grid').html() );
    
    PagingView.prototype.template      = _.template( $('#t-paging-view').html() );
    SearchView.prototype.template      = _.template( $('#t-search-box').html() );
    UserListView.prototype.template    = _.template( $('#t-user-item').html() );
    UserStateView.prototype.template   = _.template( $('#t-user-state').html() );
    SubheadView.prototype.template     = _.template( $('#t-subhead-view').html() );
    SystemView.prototype.template      = _.template( $('#t-system-view').html() );
    ClusterListView.prototype.template = _.template( $('#t-media-item').html() );
    AnalyzeHeroView.prototype.template = _.template( $('#t-analyze-hero').html() );
    AboutView.prototype.template       = _.template( $('#t-about-view').html() );
    
    var app = new AppRouter();
    Backbone.history.start();
  });

})(jQuery);
