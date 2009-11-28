class PlaylistsController < ApplicationController
  def index
    if logged_in?
      #current_user.client.
      render :json => {
        :playlists => [
          {
            :title => "My SoundCloud Tracks",
            :location => "/playlists/SC-Tracks",
            :identifier => "SC-Tracks"
          },
          {
            :title => "My SoundCloud Favorites",
            :location => "/playlists/SC-Favorites",
            :identifier => "SC-Favorites"
          },
        ]
      }
    else
      render :layout => false
    end
  end
    
  def view      
    if params[:playlist_param]=='SC-Tracks'
      tracks = current_user.client.Track.find(:all, :from => '/me/tracks').map { |t| sc_api_track_to_xspf_track(t) }
      render :json => {
        :title => "My SoundCloud Tracks",
        :location => "/playlists/SC-Tracks",
        :identifier => "SC-Tracks",
        :tracks => tracks
      }
    elsif params[:playlist_param]=='SC-Favorites'
      tracks = current_user.client.Track.find(:all, :from => '/me/favorites').map { |t| sc_api_track_to_xspf_track(t) }
      render :json => {
        :title => "My SoundCloud Favorites",
        :location => "/playlists/SC-Favorites",
        :identifier => "SC-Favorites",
        :tracks => tracks
      }
    else
      render :layout => false
    end
  end
end
  