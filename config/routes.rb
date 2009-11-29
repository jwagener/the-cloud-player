ActionController::Routing::Routes.draw do |map|
  map.resources :campaigns

  # The priority is based upon order of creation: first created -> highest priority.
  # You can have the root of your site routed with map.root -- just remember to delete public/index.html.
  map.root :controller => "players"

  map.with_options :controller => "SoundcloudConnect" do |sc|
    sc.soundcloud_connect_access_token   '/soundcloud-connect/access_token',   :action => 'access_token'
    sc.soundcloud_connect_request_token  '/soundcloud-connect/request_token',  :action => 'request_token'
    sc.soundcloud_connect_logout         '/soundcloud-connect/logout',  :action => 'logout'
  end

  # See how all your routes lay out with "rake routes"
  map.playlists '/playlists.:format', :controller => 'playlists', :action => 'index', :method => :get
  #map.playlist  '/playlists/:playlist_param.:format', :controller => 'playlists', :action => 'view'
  map.playlist_view  '/playlists/view.:format', :controller => 'playlists', :action => 'view', :method => :get
  
  map.playlist_create  '/playlists.:format', :controller => 'playlists', :action => 'create', :method => :post


  
  map.api '/api/:resource.:format', :controller => 'api', :action => 'index'


  map.view_campaign '/:user/:track', :controller => 'campaigns', :action => 'view'
  map.download_campaign '/:user/:track/download', :controller => 'campaigns', :action => 'download'

  # Install the default routes as the lowest priority.
  # Note: These default routes make all actions in every controller accessible via GET requests. You should
  # consider removing or commenting them out if you're using named routes and resources.
  map.connect ':controller/:action/:id'
  map.connect ':controller/:action/:id.:format'
end
