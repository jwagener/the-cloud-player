gem 'nokogiri'
require 'nokogiri'

class PlaylistsController < ApplicationController
  def index
    if logged_in?
      #current_user.access_tokens.each do |access_token|
#      p Hash.from_xml(current_user.real_access_token.get('/xspf/index').body)['playlistList']['playlist']
      xml = current_user.real_access_token.get('/xspf/index').body
      doc = Nokogiri::XML(xml)
      
      playlists = Hash.from_xml(current_user.real_access_token.get('/xspf/index').body)['playlistList']['playlist'].map do |playlist|
     # playlists 
      #playlists = doc.xpath('//playlist').map do |playlist|
      #  playlist_hash = {}
      #  p playlist.to_hash
       #p playlist.children['']
      #  p playlist.methods.sort
#        playlist['image'] 
        playlist['provider_id'] = 1
        playlist['location'] = playlist_remote_view_path(:location => playlist['location'])
                
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
    
  def remote
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
    playlist = if params[:location].blank?
      # local
      Playlist.create(params[:playlist].merge({:user_id => current_user.id}))
    else
      # a remote playlist
      Playlist.create(:location => params[:location], :user_id => current_user.id)
    end
    render :json => playlist.to_jspf
  end
  
  def update
    # TODO Security
    playlist = Playlist.find_by_id(params[:playlist_param])
    
    playlist.update_attributes!(params[:playlist])
    update_tracks(playlist, params[:playlist][:tracks])
    render :json => playlist.to_jspf
  end
  
  
  def destroy
    Playlist.find_by_location(params[:location]).destroy
  end
  
  private
  
  def update_tracks(playlist, tracks_params)
    tracks_params.each_with_index do |track_params, i|
      track = Track.find_or_create_by_location(track_params, :include => [:listings])
      track.update_attributes!(track_params)
      
      has_listing = false 
      
      track.listings.each do |listing|
        if listing.playlist == playlist
          listing.update_attributes!(:position => i) if listing.position != i
          has_listing = true
        end
      end
      
      unless has_listing
        playlist.listings.create!(:track => track, :position => i)
      end
    end      
  end
end
  