define(['backbone'], function() {
  return Backbone.View.extend({
    tagName: 'div',
    attributes: {'class': 'search-box'},
    template: _.template( $('#t-search-box').html() ),
    events: {
      'submit form': 'submit',
      'click button.clear': 'clear',
      'input input': 'input'
    },
    initialize: function() { 
      this.model.bind('change:query', this.change, this);
      this.render();
    },
    render: function() {
      return this.$el.html(this.template()), this.$('button.clear').hide(), this;
    },
    submit: function(e) {
      var node = this.$('input'), query = node.val();
      if(query.length > 0) {
        this.model.set({'query': query, 'index': 0});
        node.blur();
      }
      return false;
    },
    clear: function(e) {
      this.$('input').val(''), this.$('button.clear').hide();
      if(this.model.get('query')) this.model.set('query', '');
    },
    input: function(e) {
      var flag = this.$('input').val().length > 0, button = this.$('button.clear');
      return (flag?button.show():button.hide());
    },
    change: function(model, value, options) {
      this.$('input').val(value);
    }
  })
})