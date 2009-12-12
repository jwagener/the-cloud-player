ActionController::Routing::Routes.draw do |map|
  map.open_id_complete 'session', :controller => "sessions", :action => "create", :requirements => { :method => :get }
  map.resource :session

  # The priority is based upon order of creation: first created -> highest priority.
  # You can have the root of your site routed with map.root -- just remember to delete public/index.html.
  map.root :controller => "players"

  map.with_options :controller => "SoundcloudConnect" do |sc|
    sc.soundcloud_connect_access_token   '/soundcloud-connect/access_token',   :action => 'access_token'
    sc.soundcloud_connect_request_token  '/soundcloud-connect/request_token',  :action => 'request_token'
    sc.soundcloud_connect_logout         '/soundcloud-connect/logout',  :action => 'logout'
  end

  # See how all your routes lay out with "rake routes"
  map.playlists '/playlists.:format', :controller => 'playlists', :action => 'index', :conditions => {:method => :get}
  
  #map.playlist  '/playlists/:playlist_param.:format', :controller => 'playlists', :action => 'view'
  map.playlist_remote_view '/playlists/remote.:format',     :controller => 'playlists', :action => 'remote',    :conditions => {:method => :get}
  map.playlist_view        '/playlists/:playlist_param.:format',     :controller => 'playlists', :action => 'view',    :conditions => {:method => :get}
  map.playlist_update      '/playlists/:playlist_param',  :controller => 'playlists', :action => 'update',  :conditions => {:method => :put}
  map.playlist_create      '/playlists.:format',          :controller => 'playlists', :action => 'create',  :conditions => {:method => :post}
  map.playlist_destroy     '/playlists/:playlist_param.:format',          :controller => 'playlists', :action => 'destroy', :conditions => {:method => :delete}


  
  map.api '/api/:resource.:format', :controller => 'api', :action => 'index'


  # Install the default routes as the lowest priority.
  # Note: These default routes make all actions in every controller accessible via GET requests. You should
  # consider removing or commenting them out if you're using named routes and resources.
  map.connect ':controller/:action/:id'
  map.connect ':controller/:action/:id.:format'
end
