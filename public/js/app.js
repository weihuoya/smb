define(['view/subhead', 'view/footer', 'view/system', 'view/login', 'view/about', 'view/status/status', 'view/user/user', 'view/cluster/cluster', 'backbone'], 
function(SubheadView, FooterView, SystemView, LoginView, AboutView, StatusView, UserView, ClusterView) {
  return Backbone.Router.extend({
    subhead: $('#subhead'),
    content: $('#content'),
    routes: {
      ''       : 'home',
      'home'   : 'home',
      'status' : 'status',
      'login'  : 'login',
      'about'  : 'about',
      'user'   : 'user',
      'analyze': 'analyze',
      'user/:act/:id'    : 'user',
      //'analyze/:id/:k/:p': 'analyze'
    },
    initialize: function() {
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
    analyze: function(id, k, page) {
      if(!this.clusterView) this.clusterView = new ClusterView();
      this.subhead.hide();
      this.content.children().detach();
      this.content.append(this.clusterView.$el).append(this.footerView.$el);
    },
    about: function() {
      if(!this.aboutView) this.aboutView = new AboutView();
      this.subhead.hide();
      this.content.children().detach();
      this.content.append(this.aboutView.$el).append(this.footerView.$el);
    }
  })
})