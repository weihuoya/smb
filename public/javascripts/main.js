(function($){
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
    initialize: function() { this.render(); },
    
    render: function() {
      this.$el.html( $('#t-collection-header').html() );
      _(this.collection).each(function(model) {
        //index name and remove default _id index
        model.indexSizes = Object.keys(model.indexSizes);
        model.indexSizes.shift();
        //mongodb 2.2
        if(typeof model.systemFlags === 'undefined') model.systemFlags = 0;
        if(typeof model.userFlags === 'undefined') model.userFlags = 0;
        
        this.$el.append(this.template(model));
      }, this);
      
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
        model.sizeOnDisk >>= 20;
        this.$el.append(this.template(model));
      }, this);
      
      return this;
    }
  });
  
  var CrawlerMetricsView = BaseView.extend({
    initialize: function() { this.render(); },
    
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
      
      /*
      var group = svg.append('g').attr('transform', "translate(" + cx + "," + cy + ")");
      group.append('circle').attr('r', outerRadius).attr('fill', 'url(#outergrad)').style('stroke', '#b2d5ed');
      group.append('circle').attr('r', innerRadius).attr('fill', 'url(#innergrad)').style('stroke', '#b5d8f0');

      var backtube = d3.svg.arc().startAngle(startAngle).endAngle(endAngle).innerRadius(innerRadius+5).outerRadius(outerRadius-5);

      group.append('path').attr('d', backtube).attr('fill', 'url(#tubegrad)').style('stroke', '#bcd4e5');
      var loader = group.append('path').attr('class', 'loadtube').attr('fill', 'url(#loadgrad)');
      simpleFx(1500, function(percent) {
        var loadtube = d3.svg.arc().startAngle(startAngle).endAngle(endAngle*percent).innerRadius(innerRadius+5).outerRadius(outerRadius-5);
        loader.attr('d', loadtube);
      });
      */
    }
  });

  var StatusMetricsView = BaseView.extend({
    initialize: function() { this.render(); },

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
        return "translate(" + d.x + "," + d.y + ")";
      });
      bubbleLoader(node);
      /*
      node.append('title').text(function(d) {
        return d.data.sid;
      });
      node.append('circle').attr('r', function(d) {
        return d.r;
      }).style('fill', 'white').style('stroke', 'lightsalmon').style('stroke-width', '1px');
      node.append('text').attr('dy', '3').style('text-anchor', 'middle')
      .text(function(d) {
        return d.data.sid;
      });
      */
      //console.log(this.collection);
    }
  });

  var UserMetricsView = BaseView.extend({
    initialize: function() { this.render(); },

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
        return "translate(" + d.y + "," + d.x + ")";
      });

      group.append('circle').attr('class', 'point').attr('r', 10)
      .style('fill', 'lightsalmon').style('stroke', 'red').style('stroke-width', '1px');

      group.append('text').attr('text-anchor', function(d) {
        return d.children.length ? "end" : "start";
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
    initialize: function() { this.render(); },
    
    render: function() {
      this.$el.html( $('#t-metrics-list').html() );
      return this;
    }
  });
  
  var WeiboListView = BaseView.extend({
    tagName: 'ul',
    attributes: { 'class': 'nav nav-list' },
    initialize: function() { this.render(); },
    
    render: function() {
      this.$el.html( $('#t-weibo-list').html() );
      return this;
    }
  });
  
  var StatusView = BaseView.extend({
    cache: {},
    events: { 'click #status-list a' : 'stats' },
    initialize: function() { this.render(); },
    
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
  
  var LoginView = BaseView.extend({
    initialize: function() { this.render(); },
    
    render: function() {
      this.setElement( $('#t-user-login').html() );
      return this;
    }
  });
  
  var AppRouter = Backbone.Router.extend({
    routes: {
      "status" : "status",
      "user"  : "login"
    },

    status: function() {
      if(!this.statusView) this.statusView = new StatusView();
      $('#content').children().detach();
      $('#content').append( this.statusView.$el );
      //this.statusView.delegateEvents();
      //console.log('status');
    },
    
    login: function() {
      if(!this.loginView) this.loginView = new LoginView();
      $('#content').children().detach();
      $('#content').append( this.loginView.$el );
      //console.log('login');
    }
    
  });
  
  $.get('/template.html', function(data) {
    $('body').append(data);
    
    CollectionListView.prototype.template = _.template( $('#t-collection-body').html() );
    DatabaseListView.prototype.template = _.template( $('#t-database-list').html() );
    
    app = new AppRouter();
    Backbone.history.start();
  });

})(jQuery);
