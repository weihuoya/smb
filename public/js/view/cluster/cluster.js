define(['underscore', 'jquery', 'backbone', 'view/paging', 'view/cluster/datepick', 'view/cluster/recordlist', 'view/cluster/recordpaginator', 'view/cluster/statuslist', 'view/cluster/clusterpaginator', 'view/cluster/clusterPaging'], 
function(_, $, Backbone, PagingView, DatePickView, RecordListView, RecordPaginator, StatusListView, ClusterPaginator, ClusterPagingView) {
  return Backbone.View.extend({
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
    events: {'click ul.nav-list a': 'select'},
    initialize: function() {
      this.recordPaginator = new RecordPaginator(),
      this.clusterPaginator = new ClusterPaginator(),
      
      this.datePickView = new DatePickView(),
      this.recordPagingView = new PagingView({model: this.recordPaginator.page}),
      this.recordListView = new RecordListView({collection: this.recordPaginator}),
      
      this.clusterPagingView = new ClusterPagingView({model: this.clusterPaginator.page}),
      this.statusListView = new StatusListView({collection: this.clusterPaginator}),
      this.render();
      
      var self = this;
      self.clusterPaginator.page.on('change', function() { self.clusterPaginator.fetch() });
      
      self.recordPaginator.fetch({success: function(collection, resp, options) {
        self.recordPaginator.page.bind('change', function() { self.recordPaginator.fetch() })
      }});
    },
    render: function() {
      var node = $('<div class="span3 well sidebar-nav"/><div class="span9"/>');
      this.$el.html( node );
      node.eq(0).append(this.datePickView.$el).append(this.recordListView.$el).append(this.recordPagingView.$el);
      node.eq(1).append(this.clusterPagingView.$el).append(this.statusListView.$el);
    },
    select: function(e) {
      var id = $(e.currentTarget).data('name');
      if(id) id = parseInt(id, 10), this.clusterPaginator.page.set({'id': id, 'k': 1});
    }
  })
})