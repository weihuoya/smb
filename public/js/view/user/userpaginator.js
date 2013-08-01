define(['underscore', 'jquery', 'backbone', 'view/paginator'], function(_, $, Backbone, Paginator) {
  return Paginator.extend({
    page: new Backbone.Model({'query': '', 'index': 0, 'total': 0}),
    url: function() {
      var query = this.page.get('query'), index = this.page.get('index'), link = '/data/user/';
      if(index > 0) index -= 1;
      link += query ? query+'/'+index : index;
      return link;
    },
    parse: function(response) {
      var count = Math.ceil(response.total / response.limit);
      if(response.total > 0) response.index += 1;
      this.page.set({'index': response.index, 'total': count});
      return response.users;
    }
  })
})