class PlaylistsController < ApplicationController
  def index
    if logged_in?
      #current_user.access_tokens.each do |access_token|
      playlists = Hash.from_xml(current_user.real_access_token.get('/xspf/index').body)['playlistList']['playlist'].map do |playlist|
        playlist['provider_id'] = 1
        #playlist['provider_icon'] = '/images/favicon.png'
        playlist['location'] = playlist_view_path(:location => playlist['location'])
      
        playlist
      end
      
      render :json => { :playlists => playlists }
      #end
    else
      render :layout => false
    end
  end
    
  def view 
    # assume soundcloud only for now     
    uri = URI.parse(params[:location])
    relative_url = "#{uri.path}?#{uri.query}"
    playlist = Hash.from_xml(current_user.real_access_token.get(relative_url).body)['playlist']
    playlist['provider_id'] = 1
    playlist['tracks'] = playlist['trackList']['track'].map do |track|
      track['provider_id'] = 1
      
      track['extensions'].each do |k, v|
        track[k] = v  
      end
      track.delete('extensions') 
      track
    end
    playlist.delete('trackList')
    render :json => playlist
  end
  
  def create
    #playlist = Playlist.from_location(params[:url])
    playlist = Playlist.new(:location => params[:location])
    
    # TODO persiste !:) 
    #uri = URI.parse(params[:url])
    
    render :json => playlist.to_jspf
  end
end
  