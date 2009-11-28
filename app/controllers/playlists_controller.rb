class PlaylistsController < ApplicationController
  def index
    if logged_in?
      #current_user.client.
      render :json => {
        :playlists => [
          {
            :title => "My SoundCloud Tracks",
            :location => "/playlists/SC-Tracks",
            :identifier => "..."
          },
          {
            :title => "My SoundCloud Favorites",
            :location => "/playlists/SC-Favorites",
            :identifier => "..."
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
        :identifier => "...",
        :tracks => tracks
      }
    elsif params[:playlist_param]=='SC-Favorites'
      tracks = current_user.client.Track.find(:all, :from => '/me/favorites').map { |t| sc_api_track_to_xspf_track(t) }
      render :json => {
        :title => "My SoundCloud Tracks",
        :location => "/playlists/SC-Tracks",
        :identifier => "...",
        :tracks => tracks
      }
    else
      render :layout => false
    end
  end
end
  