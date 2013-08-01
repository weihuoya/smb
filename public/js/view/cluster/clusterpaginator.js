define(['underscore', 'jquery', 'backbone', 'view/paginator'], function(_, $, Backbone, Paginator) {
  return Paginator.extend({
    page: new Backbone.Model({'id': 0, 'index': 0, 'total': 0, 'k': 0, 'count': 0}),
    url: function() {
      var id = this.page.get('id'), index = this.page.get('index'), k = this.page.get('k'), link = 'data/cluster/'+id+'/';
      if(index > 0) index -= 1;
      link += k+'/'+index;
      return link;
    },
    parse: function(response) {
      var count = Math.ceil(response.total / response.limit);
      if(response.total > 0) response.index += 1;
      if(response.count > 0) response.count -= 1;
      this.page.set({'k': response.k, 'count': response.count, 'index': response.index, 'total': count});
      return response.clusters;
    }
  })
})