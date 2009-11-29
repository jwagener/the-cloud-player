class PlaylistsController < ApplicationController
  def index
    if logged_in?
      #current_user.access_tokens.each do |access_token|
      playlists = Hash.from_xml(current_user.real_access_token.get('/xspf/index').body)['playlistList']['playlist'].map do |playlist|
        playlist['provider_id'] = 1
        #playlist['provider_icon'] = '/images/favicon.png'
        playlist['location'] = playlist_view_path(:url => playlist['location'])
      
        playlist
      end
      
      render :json => { :playlists => playlists }
      #end
      
      #render :json => {
      #  :playlists => [
      #    {
      #      :title => "My SoundCloud Tracks",
      #      :location => "/playlists/SC-Tracks",
      #      :identifier => "SC-Tracks"
      #    },
      #    {
      #      :title => "My SoundCloud Favorites",
      #      :location => "/playlists/SC-Favorites",
      #      :identifier => "SC-Favorites"
      #    },
      #  ]
      #}
    else
      render :layout => false
    end
  end
    
  def view 
    # assume soundcloud only for now     
    uri = URI.parse(params[:url])
    relative_url = "#{uri.path}?#{uri.query}"
    playlist = Hash.from_xml(current_user.real_access_token.get(relative_url).body)['playlist']
    playlist['provider_id'] = 1
    playlist['tracks'] = playlist['trackList']['track'].map do |track|
      track['provider_id'] = 1
      track
    end
    playlist.delete('trackList')
    render :json => playlist
    
    
    #if params[:playlist_param]=='SC-Tracks'
    #  tracks = current_user.client.Track.find(:all, :from => '/me/tracks').map { |t| sc_api_track_to_xspf_track(t) }.compact
    #  render :json => {
    #    :title => "My SoundCloud Tracks",
    #    :location => "/playlists/SC-Tracks",
    #    :identifier => "SC-Tracks",
    #    :tracks => tracks
    #  }
    #elsif params[:playlist_param]=='SC-Favorites'
    #  tracks = current_user.client.Track.find(:all, :from => '/me/favorites').map { |t| sc_api_track_to_xspf_track(t) }.compact
    #  render :json => {
    #    :title => "My SoundCloud Favorites",
    #    :location => "/playlists/SC-Favorites",
    #    :identifier => "SC-Favorites",
    #    :tracks => tracks
    #  }
    #else
    #  render :layout => false
    #end
  end
end
  