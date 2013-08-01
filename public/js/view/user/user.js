define(['underscore', 'jquery', 'backbone', 'view/search', 'view/paging', 'view/user/userpaginator', 'view/user/userlist', 'view/user/userstate'], function(_, $, Backbone, SearchView, PagingView, UserPaginator, UserListView, UserStateView) {
  return Backbone.View.extend({
    cache: {},
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
    events: { 'click .user-item' : 'select' },
    initialize: function() {
      this.paginator = new UserPaginator(),
      this.searchView = new SearchView({model: this.paginator.page}),
      this.pagingView = new PagingView({model: this.paginator.page}),
      this.userListView = new UserListView({collection: this.paginator}),
      this.userStateView = new UserStateView(),
      this.render();
      
      var self = this;
      self.paginator.fetch({success: function(collection, resp, options) {
        self.paginator.page.bind('change', function() { self.paginator.fetch() })
      }});
    },
    render: function() {
      var node = $('<div class="span3 well sidebar-nav"/><div class="span9"/>');
      this.$el.html( node );
      node.eq(0).append(this.searchView.$el).append(this.userListView.$el).append(this.pagingView.$el);
      node.eq(1).append(this.userStateView.$el);
      return this;
    },
    select: function(e) {
      var self = this, user = $(e.currentTarget).data('user'), key = '/data/state/'+user, data = self.cache[key];
      location.hash = '#user/state/'+user;
      if(!data) {
        $.getJSON(key, function(data) {
          self.userStateView.show(data);
          self.cache[key] = data;
        });
      } else {
        self.userStateView.show(data);
      }
    }
  })
})