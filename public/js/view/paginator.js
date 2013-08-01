define(['backbone'], function() {
  return Backbone.Collection.extend({
    cache: {},
    page: new Backbone.Model(),
    sync: function(method, model, options) {
      var self = this, xhr, success = options.success, error = options.error, query = this.query ? _.clone(this.query) : {};
      _.each(query, function(value, key) {
        if(_.isFunction(value)) {
          query[key] = value.call(this);
        }
      }, this);
      query = _.defaults(query, {
        type: 'GET',
        dataType: 'json',
        processData: false,
        url: _.result(this, 'url')
      });
      query.success = function(resp, status, xhr) {
        if (success) success( resp, status, xhr );
        model.trigger('sync', model, resp, query);
        self.cache[query.url] = resp;
      };
      query.error = function(xhr) {
        if (error) error(model, xhr, query);
        model.trigger('error', model, xhr, query);
      };
      
      if(self.cache[query.url]) {
        query.success(self.cache[query.url]);
      } else {
        xhr = query.xhr = Backbone.ajax(query);
        model.trigger('request', model, xhr, query);
        return xhr;
      }
    }
  })
})