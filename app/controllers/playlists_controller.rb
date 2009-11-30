class PlaylistsController < ApplicationController
  def index
    if logged_in?
      #current_user.access_tokens.each do |access_token|
      playlists = Hash.from_xml(current_user.real_access_token.get('/xspf/index').body)['playlistList']['playlist'].map do |playlist|
        playlist['provider_id'] = 1
        playlist['location'] = playlist_view_path(:location => playlist['location'])
      
        playlist
      end
      
      playlists = playlists + Playlist.find(:all, :conditions => ['user_id = ?',current_user.id]).map(&:to_jspf)
      
      render :json => { :playlists => playlists }
      #end
    else
      playlists = [ Playlist.new(:location => 'http://sandbox-soundcloud.com/xspf?url=http://sandbox-soundcloud.com/forss/sets/soulhack') ] 
      playlists = playlists.map(&:to_jspf)
      
      render :json => { :playlists => playlists }
    end
  end
    
  def view 
    location = params[:location]
    if URI.parse(location).host == 'sandbox-soundcloud.com'
      access_token = current_user
    else
      access_token = nil
    end
    playlist = Playlist.new(:location => params[:location], :access_token => access_token)
    render :json => playlist.to_jspf
  end
  
  def create
    #playlist = Playlist.from_location(params[:url])
    playlist = Playlist.create(:location => params[:location], :user_id => current_user.id)
    render :json => playlist.to_jspf
  end
  
  
  def destroy
    Playlist.find_by_location(params[:location]).destroy
  end
end
  